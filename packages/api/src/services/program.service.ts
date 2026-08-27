import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  ExerciseRow,
  ExerciseStyleRow,
  ProgramRow,
  SessionRow,
} from "@hooper/db";
import { getClient } from "../client";

// Mirrors apps/web/src/services/programShaping.ts's BLOCK_EXERCISE_SELECT /
// SESSION_SELECT — that file isn't importable from mobile (it lives in the
// Next app), so the nested-select shape is duplicated here. Lighter than the
// web version: no exercise_category_links/exercise_unit_types/defaultStyle/
// variants list, since the session player doesn't browse the library, just
// needs the exercise itself, its planned measurements, its resolved style,
// and its per-set variant/style overrides.
const BLOCK_EXERCISE_SELECT =
  "*, exercise:exercises(*), block_exercise_measurements(*), style:exercise_styles(*), block_exercise_set_variants(set_index, exercise:exercises(*)), block_exercise_set_styles(set_index, style:exercise_styles(*))";
const BLOCK_SELECT = `*, block_exercises(${BLOCK_EXERCISE_SELECT})`;
const SESSION_SELECT = `*, blocks(${BLOCK_SELECT})`;

export type AthleteBlockExercise = BlockExerciseRow & {
  exercise: ExerciseRow;
  measurements: BlockExerciseMeasurementRow[];
  style: ExerciseStyleRow | null;
  /** Sparse, keyed by set_index — only sets whose exercise differs from
   * exercise_id have an entry. */
  setVariants: Record<number, ExerciseRow>;
  /** Sparse, keyed by set_index — a null entry means that set explicitly
   * has no style; a missing key means it inherits `style`. */
  setStyles: Record<number, ExerciseStyleRow | null>;
};
export type AthleteBlock = BlockRow & { exercises: AthleteBlockExercise[] };
export type AthleteSessionDetail = SessionRow & { blocks: AthleteBlock[] };

type RawBlockExercise = BlockExerciseRow & {
  exercise: ExerciseRow;
  block_exercise_measurements: BlockExerciseMeasurementRow[];
  style: ExerciseStyleRow | null;
  block_exercise_set_variants: { set_index: number; exercise: ExerciseRow }[];
  block_exercise_set_styles: {
    set_index: number;
    style: ExerciseStyleRow | null;
  }[];
};
type RawBlock = BlockRow & { block_exercises: RawBlockExercise[] };
type RawSession = SessionRow & { blocks: RawBlock[] };

function shapeSession(raw: RawSession): AthleteSessionDetail {
  const { blocks, ...session } = raw;
  return {
    ...session,
    blocks: [...blocks]
      .sort((a, b) => a.position - b.position)
      .map(({ block_exercises, ...block }) => ({
        ...block,
        exercises: [...block_exercises]
          .sort((a, b) => a.position - b.position)
          .map(
            ({
              block_exercise_measurements,
              block_exercise_set_variants,
              block_exercise_set_styles,
              ...blockExercise
            }) => ({
              ...blockExercise,
              measurements: [...block_exercise_measurements].sort(
                (a, b) => a.position - b.position || a.set_index - b.set_index,
              ),
              setVariants: Object.fromEntries(
                block_exercise_set_variants.map((v) => [
                  v.set_index,
                  v.exercise,
                ]),
              ),
              setStyles: Object.fromEntries(
                block_exercise_set_styles.map((s) => [s.set_index, s.style]),
              ),
            }),
          ),
      })),
  };
}

export type AthleteProgramCard = {
  program: ProgramRow;
  totalSessions: number;
  completedSessions: number;
  currentWeek: number;
  lastSessionDurationSeconds: number | null;
  nextSessionId: string | null;
  nextSessionName: string | null;
  /** Count of sessions with an in-progress completion for this athlete —
   * can be >1 if they started one session, left without finishing it, then
   * started a different one. */
  activeSessionCount: number;
};

export type AthleteSessionListItem = {
  id: string;
  weekNumber: number;
  position: number;
  name: string;
  blockCount: number;
  done: boolean;
  current: boolean;
  active: boolean;
  /** When `active`, the timestamp the in-progress attempt was started. */
  activeStartedAt: string | null;
  durationSeconds: number | null;
};

/** program_athletes ∪ (program_teams via the athlete's team_members) — there
 * is no single "assignment" row, access can come from either path (or both
 * at once), so this is a union of ids, not a join. */
async function assignedProgramIds(athleteProfileId: string): Promise<string[]> {
  const client = getClient();
  const [direct, teams] = await Promise.all([
    client
      .from("program_athletes")
      .select("program_id")
      .eq("profile_id", athleteProfileId),
    client
      .from("team_members")
      .select("team_id")
      .eq("profile_id", athleteProfileId),
  ]);
  if (direct.error) throw new Error(direct.error.message);
  if (teams.error) throw new Error(teams.error.message);

  const ids = new Set((direct.data ?? []).map((r) => r.program_id));

  const teamIds = (teams.data ?? []).map((r) => r.team_id);
  if (teamIds.length > 0) {
    const { data: viaTeams, error } = await client
      .from("program_teams")
      .select("program_id")
      .in("team_id", teamIds);
    if (error) throw new Error(error.message);
    for (const row of viaTeams ?? []) ids.add(row.program_id);
  }

  return [...ids];
}

async function buildProgramCard(
  program: ProgramRow,
  athleteProfileId: string,
): Promise<AthleteProgramCard> {
  const client = getClient();
  const { data: sessions, error: sessionsError } = await client
    .from("sessions")
    .select("id, week_number, position, name")
    .eq("program_id", program.id)
    .order("week_number")
    .order("position");
  if (sessionsError) throw new Error(sessionsError.message);

  if (!sessions || sessions.length === 0) {
    return {
      program,
      totalSessions: 0,
      completedSessions: 0,
      currentWeek: 1,
      lastSessionDurationSeconds: null,
      nextSessionId: null,
      nextSessionName: null,
      activeSessionCount: 0,
    };
  }

  const sessionIds = sessions.map((s) => s.id);

  const [
    { data: completions, error: completionsError },
    { data: activeRows, error: activeError },
  ] = await Promise.all([
    client
      .from("session_completions")
      .select("session_id, active_duration_seconds, completed_at")
      .eq("athlete_profile_id", athleteProfileId)
      .eq("status", "completed")
      .in("session_id", sessionIds)
      .order("completed_at", { ascending: false }),
    client
      .from("session_completions")
      .select("session_id")
      .eq("athlete_profile_id", athleteProfileId)
      .eq("status", "in_progress")
      .in("session_id", sessionIds),
  ]);
  if (completionsError) throw new Error(completionsError.message);
  if (activeError) throw new Error(activeError.message);

  const completedIds = new Set((completions ?? []).map((c) => c.session_id));
  const nextSession = sessions.find((s) => !completedIds.has(s.id)) ?? null;

  return {
    program,
    totalSessions: sessions.length,
    completedSessions: completedIds.size,
    currentWeek:
      nextSession?.week_number ?? sessions[sessions.length - 1].week_number,
    lastSessionDurationSeconds:
      completions?.[0]?.active_duration_seconds ?? null,
    nextSessionId: nextSession?.id ?? null,
    nextSessionName: nextSession?.name ?? null,
    activeSessionCount: activeRows?.length ?? 0,
  };
}

export async function getProgram(programId: string): Promise<ProgramRow> {
  const client = getClient();
  const { data, error } = await client
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Programs assigned to the athlete (directly or via a team), each annotated
 * with completion progress computed from session_completions — there is no
 * stored "progress" anywhere, it's derived at read time. */
export async function listAssignedPrograms(
  athleteProfileId: string,
): Promise<AthleteProgramCard[]> {
  const client = getClient();
  const programIds = await assignedProgramIds(athleteProfileId);
  if (programIds.length === 0) return [];

  const { data: programs, error } = await client
    .from("programs")
    .select("*")
    .in("id", programIds)
    .eq("status", "active")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (programs ?? []).map((program) =>
      buildProgramCard(program, athleteProfileId),
    ),
  );
}

/** A program's full session list (every week), each flagged done/current for
 * the ProgramDetail screen. "current" is normally the first not-yet-completed
 * session in (week_number, position) order — the same rule buildProgramCard
 * uses for nextSessionId, just applied across the whole list instead of
 * stopping at the first match. Any session the athlete has actually started
 * ("active", status "in_progress") is flagged regardless of position — there
 * can be more than one (e.g. they started a session, left, then started a
 * different one) — and the most recently started of those, if any, takes
 * over "current" instead of the positional pick. */
export async function listProgramSessions(
  programId: string,
  athleteProfileId: string,
): Promise<AthleteSessionListItem[]> {
  const client = getClient();
  const { data: sessions, error: sessionsError } = await client
    .from("sessions")
    .select("id, week_number, position, name, blocks(id)")
    .eq("program_id", programId)
    .order("week_number")
    .order("position");
  if (sessionsError) throw new Error(sessionsError.message);
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const [
    { data: completions, error: completionsError },
    { data: activeRows, error: activeError },
  ] = await Promise.all([
    client
      .from("session_completions")
      .select("session_id, active_duration_seconds")
      .eq("athlete_profile_id", athleteProfileId)
      .eq("status", "completed")
      .in("session_id", sessionIds),
    client
      .from("session_completions")
      .select("session_id, started_at")
      .eq("athlete_profile_id", athleteProfileId)
      .eq("status", "in_progress")
      .in("session_id", sessionIds)
      .order("started_at", { ascending: false }),
  ]);
  if (completionsError) throw new Error(completionsError.message);
  if (activeError) throw new Error(activeError.message);

  const byId = new Map((completions ?? []).map((c) => [c.session_id, c]));
  const activeById = new Map(
    (activeRows ?? []).map((r) => [r.session_id, r.started_at]),
  );
  const primaryActiveId = activeRows?.[0]?.session_id ?? null;
  let markedCurrent = false;
  const items: AthleteSessionListItem[] = [];
  for (const s of sessions) {
    const completion = byId.get(s.id);
    const done = !!completion;
    const active = activeById.has(s.id);
    const current = primaryActiveId
      ? s.id === primaryActiveId
      : !done && !markedCurrent;
    if (!primaryActiveId && current) markedCurrent = true;
    items.push({
      id: s.id,
      weekNumber: s.week_number,
      position: s.position,
      name: s.name,
      blockCount: Array.isArray(s.blocks) ? s.blocks.length : 0,
      done,
      current,
      active,
      activeStartedAt: activeById.get(s.id) ?? null,
      durationSeconds: completion?.active_duration_seconds ?? null,
    });
  }
  return items;
}

/** Full block/exercise tree for the session player. */
export async function getSessionDetail(
  sessionId: string,
): Promise<AthleteSessionDetail> {
  const client = getClient();
  const { data, error } = await client
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .single();
  if (error) throw new Error(error.message);
  return shapeSession(data as unknown as RawSession);
}
