import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { ProgramProgressStats } from "@hooper/db";
import { cache } from "react";

type SessionRef = { id: string; program_id: string; week_number: number };
type CompletionRow = {
  session_id: string;
  athlete_profile_id: string;
  completed_at: string | null;
  session_date: string;
};

const EMPTY: ProgramProgressStats = {
  sessionsComplete: 0,
  week: null,
  lastCompletedAt: null,
};

/** Recency key for a completion — completed_at, falling back to the
 * client-set local session_date when a row was completed without a
 * timestamp. */
function completionSortKey(row: CompletionRow): string {
  return row.completed_at ?? `${row.session_date}T00:00:00Z`;
}

/** The client stores completed_at once at completion; older/partial rows
 * may only have the local session_date. */
function completionDate(row: CompletionRow): string {
  return row.completed_at ?? row.session_date;
}

function isNewer(candidate: CompletionRow, current: CompletionRow | undefined) {
  return !current || completionSortKey(candidate) > completionSortKey(current);
}

async function fetchSessionsAndCompletions(
  programIds: string[],
  athleteProfileIds: string[],
): Promise<Result<{ sessions: SessionRef[]; completions: CompletionRow[] }>> {
  const supabase = await createClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, program_id, week_number")
    .in("program_id", programIds);
  if (sessionsError) return err(sessionsError.message);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0 || athleteProfileIds.length === 0) {
    return ok({ sessions: (sessions ?? []) as SessionRef[], completions: [] });
  }

  const { data: completions, error: completionsError } = await supabase
    .from("session_completions")
    .select("session_id, athlete_profile_id, completed_at, session_date")
    .eq("status", "completed")
    .in("session_id", sessionIds)
    .in("athlete_profile_id", athleteProfileIds);
  if (completionsError) return err(completionsError.message);

  return ok({
    sessions: (sessions ?? []) as SessionRef[],
    completions: (completions ?? []) as CompletionRow[],
  });
}

type ProgramAgg = {
  sessionsComplete: number;
  latest: CompletionRow | undefined;
  /** memberId -> that member's most recent completion in this program. */
  latestByMember: Map<string, CompletionRow>;
};

/** Groups completed sessions by program, tracking the completion count,
 * the most recent completion overall, and the most recent completion per
 * member (used for the team's average-week figure). */
function aggregateByProgram(
  completions: CompletionRow[],
  sessionById: Map<string, SessionRef>,
): Map<string, ProgramAgg> {
  const byProgram = new Map<string, ProgramAgg>();

  for (const row of completions) {
    const session = sessionById.get(row.session_id);
    if (!session) continue;

    let agg = byProgram.get(session.program_id);
    if (!agg) {
      agg = {
        sessionsComplete: 0,
        latest: undefined,
        latestByMember: new Map(),
      };
      byProgram.set(session.program_id, agg);
    }

    agg.sessionsComplete += 1;
    if (isNewer(row, agg.latest)) agg.latest = row;
    if (isNewer(row, agg.latestByMember.get(row.athlete_profile_id))) {
      agg.latestByMember.set(row.athlete_profile_id, row);
    }
  }

  return byProgram;
}

function weekOf(
  row: CompletionRow | undefined,
  sessionById: Map<string, SessionRef>,
): number | null {
  if (!row) return null;
  return sessionById.get(row.session_id)?.week_number ?? null;
}

function emptyStatsFor(
  programIds: string[],
): Record<string, ProgramProgressStats> {
  const stats: Record<string, ProgramProgressStats> = {};
  for (const id of programIds) stats[id] = { ...EMPTY };
  return stats;
}

/**
 * Per-program progress for a single athlete: how many of the program's
 * sessions they've completed, the week of their most recent completed
 * session, and when that was. Returns a `{ [programId]: stats }` map with
 * a zero/null entry for every id in `programIds` (an athlete who hasn't
 * started shows dashes in the UI, not a missing row).
 */
export const getAthleteProgramProgress = cache(
  async (
    athleteProfileId: string,
    programIds: string[],
  ): Promise<Result<Record<string, ProgramProgressStats>>> => {
    try {
      const stats = emptyStatsFor(programIds);
      if (programIds.length === 0) return ok(stats);

      const result = await fetchSessionsAndCompletions(programIds, [
        athleteProfileId,
      ]);
      if (!result.ok) return err(result.error);

      const { sessions, completions } = result.data;
      const sessionById = new Map(sessions.map((s) => [s.id, s]));
      const byProgram = aggregateByProgram(completions, sessionById);

      for (const [programId, agg] of byProgram) {
        if (!stats[programId]) continue;
        stats[programId] = {
          sessionsComplete: agg.sessionsComplete,
          week: weekOf(agg.latest, sessionById),
          lastCompletedAt: agg.latest ? completionDate(agg.latest) : null,
        };
      }

      return ok(stats);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

/**
 * Per-program progress aggregated across a team's members:
 * `sessionsComplete` is the team-wide total, `week` is the rounded
 * average of each member's current week (members with no completions are
 * left out of that average), and `lastCompletedAt` is the most recent
 * completion by anyone on the team.
 */
export const getTeamProgramProgress = cache(
  async (
    memberProfileIds: string[],
    programIds: string[],
  ): Promise<Result<Record<string, ProgramProgressStats>>> => {
    try {
      const stats = emptyStatsFor(programIds);
      if (programIds.length === 0 || memberProfileIds.length === 0) {
        return ok(stats);
      }

      const result = await fetchSessionsAndCompletions(
        programIds,
        memberProfileIds,
      );
      if (!result.ok) return err(result.error);

      const { sessions, completions } = result.data;
      const sessionById = new Map(sessions.map((s) => [s.id, s]));
      const byProgram = aggregateByProgram(completions, sessionById);

      for (const [programId, agg] of byProgram) {
        if (!stats[programId]) continue;

        const memberWeeks = [...agg.latestByMember.values()]
          .map((row) => weekOf(row, sessionById))
          .filter((week): week is number => week != null);
        const avgWeek =
          memberWeeks.length > 0
            ? Math.round(
                memberWeeks.reduce((sum, w) => sum + w, 0) / memberWeeks.length,
              )
            : null;

        stats[programId] = {
          sessionsComplete: agg.sessionsComplete,
          week: avgWeek,
          lastCompletedAt: agg.latest ? completionDate(agg.latest) : null,
        };
      }

      return ok(stats);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);
