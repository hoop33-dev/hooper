import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  SessionRow,
  SessionWithBlocks,
} from "@hooper/db";
import { randomUUID } from "node:crypto";
import {
  SESSION_SELECT,
  shapeBlocksWithExercises,
  type RawBlock,
} from "./programShaping";

export type CreateSessionInput = {
  program_id: string;
  week_number: number;
  name: string;
};

export type DuplicateSessionInput = {
  sourceSessionId: string;
  pattern: "every_week" | "every_2nd" | "every_3rd" | "every_4th" | "manual";
  targetWeeks: number[];
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function nextSessionPosition(
  supabase: SupabaseClient,
  programId: string,
  weekNumber: number,
): Promise<number> {
  const { data } = await supabase
    .from("sessions")
    .select("position")
    .eq("program_id", programId)
    .eq("week_number", weekNumber)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

/** Every session in a program, ordered week-then-position — the same
 * sequence the program canvas renders sessions in. Deliberately shallow (no
 * nested blocks) since this only powers prev/next navigation on the
 * single-session page. */
export async function listSessionsForProgram(
  programId: string,
): Promise<Result<SessionRow[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("program_id", programId)
      .order("week_number", { ascending: true })
      .order("position", { ascending: true });
    if (error) return err(error.message);
    return ok(data ?? []);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getSessionById(
  id: string,
): Promise<Result<SessionWithBlocks>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(SESSION_SELECT)
      .eq("id", id)
      .single();

    if (error) return err(error.message);

    const { data: cats } = await supabase
      .from("exercise_categories")
      .select("*");

    const { blocks, ...session } = data as unknown as SessionRow & {
      blocks: RawBlock[];
    };
    return ok({
      ...session,
      blocks: shapeBlocksWithExercises(blocks, cats ?? []),
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createSession(
  input: CreateSessionInput,
): Promise<Result<SessionRow>> {
  try {
    const supabase = await createClient();
    const position = await nextSessionPosition(
      supabase,
      input.program_id,
      input.week_number,
    );

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        program_id: input.program_id,
        week_number: input.week_number,
        name: input.name,
        position,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateSessionName(
  id: string,
  name: string,
): Promise<Result<SessionRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    if (data.link_group_id) {
      const { error: siblingError } = await supabase
        .from("sessions")
        .update({ name })
        .eq("link_group_id", data.link_group_id)
        .neq("id", id);
      if (siblingError) return err(siblingError.message);
    }

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Deleting a session leaves a gap in its week's position sequence (e.g.
 * 0, 2 after removing position 1) — later sessions in the same week are
 * shifted down to close it, the same renumbering `deleteProgramWeek` does
 * for week_number. */
export async function deleteSession(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const { data: target, error: targetError } = await supabase
      .from("sessions")
      .select("program_id, week_number, position")
      .eq("id", id)
      .single();
    if (targetError) return err(targetError.message);

    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) return err(error.message);

    const { data: laterSessions, error: laterError } = await supabase
      .from("sessions")
      .select("id, position")
      .eq("program_id", target.program_id)
      .eq("week_number", target.week_number)
      .gt("position", target.position);
    if (laterError) return err(laterError.message);

    for (const session of laterSessions ?? []) {
      const { error: shiftError } = await supabase
        .from("sessions")
        .update({ position: session.position - 1 })
        .eq("id", session.id);
      if (shiftError) return err(shiftError.message);
    }

    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

type SourceBlockExercise = BlockExerciseRow & {
  block_exercise_measurements: BlockExerciseMeasurementRow[];
};

export type SourceSession = SessionRow & {
  blocks: (BlockRow & { block_exercises: SourceBlockExercise[] })[];
};

async function fetchSourceSession(
  supabase: SupabaseClient,
  id: string,
): Promise<SourceSession | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*, blocks(*, block_exercises(*, block_exercise_measurements(*)))")
    .eq("id", id)
    .single();
  return (data as unknown as SourceSession) ?? null;
}

/** Every session (with full blocks/exercises/measurements depth) across a
 * set of weeks in one program, ordered week-then-position — the source
 * side of a cross-program week import (see programImport.service.ts). */
export async function fetchSourceSessionsForWeeks(
  supabase: SupabaseClient,
  programId: string,
  weekNumbers: number[],
): Promise<SourceSession[]> {
  const { data } = await supabase
    .from("sessions")
    .select("*, blocks(*, block_exercises(*, block_exercise_measurements(*)))")
    .eq("program_id", programId)
    .in("week_number", weekNumbers)
    .order("week_number", { ascending: true })
    .order("position", { ascending: true });
  return (data as unknown as SourceSession[]) ?? [];
}

/** Group ids to stamp onto a copy so it joins an existing link group instead
 * of being an independent, unlinked duplicate (see `setLinkedWeeks`). */
type LinkedGroupIds = {
  sessionGroupId: string;
  blockGroupIds: Map<string, string>;
  exerciseGroupIds: Map<string, string>;
};

export async function copySessionIntoWeek(
  supabase: SupabaseClient,
  source: SourceSession,
  destinationProgramId: string,
  targetWeek: number,
  groupIds?: LinkedGroupIds,
): Promise<Result<SessionRow>> {
  const position = await nextSessionPosition(
    supabase,
    destinationProgramId,
    targetWeek,
  );

  const { data: newSession, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      program_id: destinationProgramId,
      week_number: targetWeek,
      name: source.name,
      position,
      link_group_id: groupIds?.sessionGroupId ?? null,
    })
    .select()
    .single();
  if (sessionError) return err(sessionError.message);

  if (source.blocks.length === 0) return ok(newSession);

  const { data: newBlocks, error: blocksError } = await supabase
    .from("blocks")
    .insert(
      source.blocks.map((block) => ({
        session_id: newSession.id,
        name: block.name,
        color: block.color,
        position: block.position,
        link_group_id: groupIds?.blockGroupIds.get(block.id) ?? null,
      })),
    )
    .select();
  if (blocksError) return err(blocksError.message);

  const blockExerciseRows = source.blocks.flatMap((block, i) =>
    block.block_exercises.map((be) => ({
      block_id: newBlocks[i].id,
      exercise_id: be.exercise_id,
      position: be.position,
      sets: be.sets,
      notes: be.notes,
      link_group_id: groupIds?.exerciseGroupIds.get(be.id) ?? null,
    })),
  );

  if (blockExerciseRows.length > 0) {
    const { data: newBlockExercises, error: exercisesError } = await supabase
      .from("block_exercises")
      .insert(blockExerciseRows)
      .select();
    if (exercisesError) return err(exercisesError.message);

    const sourceBlockExercises = source.blocks.flatMap(
      (block) => block.block_exercises,
    );
    const measurementRows = sourceBlockExercises.flatMap((be, i) =>
      be.block_exercise_measurements.map((m) => ({
        block_exercise_id: newBlockExercises[i].id,
        position: m.position,
        unit_type: m.unit_type,
        value: m.value,
        value_entered_by: m.value_entered_by,
        value_unit: m.value_unit,
      })),
    );

    if (measurementRows.length > 0) {
      const { error: measurementsError } = await supabase
        .from("block_exercise_measurements")
        .insert(measurementRows);
      if (measurementsError) return err(measurementsError.message);
    }
  }

  return ok(newSession);
}

export async function duplicateSession(
  input: DuplicateSessionInput,
): Promise<Result<SessionRow[]>> {
  try {
    const supabase = await createClient();
    const source = await fetchSourceSession(supabase, input.sourceSessionId);
    if (!source) return err("Session not found.");

    const created: SessionRow[] = [];
    for (const week of input.targetWeeks) {
      const result = await copySessionIntoWeek(
        supabase,
        source,
        source.program_id,
        week,
      );
      if (!result.ok) return err(result.error);
      created.push(result.data);
    }

    return ok(created);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export type SetLinkedWeeksInput = {
  sessionId: string;
  /** The full desired set of linked weeks, including the session's own —
   * weeks missing from this list are removed (their session deleted),
   * weeks present but not yet linked are added (a fresh linked copy). */
  targetWeeks: number[];
};

/** Returns a row's existing link_group_id, or generates and persists a
 * fresh one if it doesn't have one yet. */
async function ensureGroupId(
  supabase: SupabaseClient,
  table: "sessions" | "blocks" | "block_exercises",
  id: string,
  existingGroupId: string | null,
): Promise<Result<string>> {
  if (existingGroupId) return ok(existingGroupId);
  const groupId = randomUUID();
  const { error } = await supabase
    .from(table)
    .update({ link_group_id: groupId })
    .eq("id", id);
  if (error) return err(error.message);
  return ok(groupId);
}

/** Assigns fresh link_group_ids (session, and each of its blocks/
 * block-exercises) to a session that isn't linked to anything yet — the
 * first time a session gets linked, it becomes "the source" of a new
 * group of one, ready to gain siblings. Rows that already have a group id
 * (already linked) keep it untouched. */
async function ensureLinkGroups(
  supabase: SupabaseClient,
  source: SourceSession,
): Promise<Result<LinkedGroupIds>> {
  const sessionGroupResult = await ensureGroupId(
    supabase,
    "sessions",
    source.id,
    source.link_group_id,
  );
  if (!sessionGroupResult.ok) return err(sessionGroupResult.error);

  const blockGroupIds = new Map<string, string>();
  const exerciseGroupIds = new Map<string, string>();

  for (const block of source.blocks) {
    const blockGroupResult = await ensureGroupId(
      supabase,
      "blocks",
      block.id,
      block.link_group_id,
    );
    if (!blockGroupResult.ok) return err(blockGroupResult.error);
    blockGroupIds.set(block.id, blockGroupResult.data);

    for (const be of block.block_exercises) {
      const exerciseGroupResult = await ensureGroupId(
        supabase,
        "block_exercises",
        be.id,
        be.link_group_id,
      );
      if (!exerciseGroupResult.ok) return err(exerciseGroupResult.error);
      exerciseGroupIds.set(be.id, exerciseGroupResult.data);
    }
  }

  return ok({
    sessionGroupId: sessionGroupResult.data,
    blockGroupIds,
    exerciseGroupIds,
  });
}

/** A group of one isn't meaningfully linked — clears the tag back off the
 * source (and its blocks/block-exercises) when a removal leaves it alone. */
async function unlinkIfAlone(
  supabase: SupabaseClient,
  source: SourceSession,
  sessionGroupId: string,
): Promise<Result<void>> {
  const { data: remaining, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("link_group_id", sessionGroupId);
  if (error) return err(error.message);
  if ((remaining ?? []).length > 1) return ok(undefined);

  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ link_group_id: null })
    .eq("id", source.id);
  if (sessionError) return err(sessionError.message);

  if (source.blocks.length > 0) {
    const { error: blocksError } = await supabase
      .from("blocks")
      .update({ link_group_id: null })
      .in(
        "id",
        source.blocks.map((b) => b.id),
      );
    if (blocksError) return err(blocksError.message);
  }

  const exerciseIds = source.blocks.flatMap((b) =>
    b.block_exercises.map((be) => be.id),
  );
  if (exerciseIds.length > 0) {
    const { error: exercisesError } = await supabase
      .from("block_exercises")
      .update({ link_group_id: null })
      .in("id", exerciseIds);
    if (exercisesError) return err(exercisesError.message);
  }

  return ok(undefined);
}

/** Which currently-linked sessions to drop and which weeks to add a fresh
 * copy for, given the full desired set of weeks — pulled out as a pure
 * function since it's the one bit of real decision-making in
 * `setLinkedWeeks` and is easy to get subtly wrong (the session's own week
 * must never be treated as addable/removable). */
export function computeWeekDiff(
  currentMembers: { id: string; week_number: number }[],
  targetWeeks: number[],
  ownWeek: number,
): { toAddWeeks: number[]; toRemoveIds: string[] } {
  const target = new Set(targetWeeks);
  target.add(ownWeek);
  const current = new Set(currentMembers.map((m) => m.week_number));

  const toRemoveIds = currentMembers
    .filter((m) => m.week_number !== ownWeek && !target.has(m.week_number))
    .map((m) => m.id);
  const toAddWeeks = [...target].filter(
    (w) => w !== ownWeek && !current.has(w),
  );
  return { toAddWeeks, toRemoveIds };
}

export async function setLinkedWeeks(
  input: SetLinkedWeeksInput,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const source = await fetchSourceSession(supabase, input.sessionId);
    if (!source) return err("Session not found.");

    const groupIdsResult = await ensureLinkGroups(supabase, source);
    if (!groupIdsResult.ok) return err(groupIdsResult.error);
    const { sessionGroupId } = groupIdsResult.data;

    const { data: currentMembers, error: membersError } = await supabase
      .from("sessions")
      .select("id, week_number")
      .eq("link_group_id", sessionGroupId);
    if (membersError) return err(membersError.message);

    const { toAddWeeks, toRemoveIds } = computeWeekDiff(
      currentMembers ?? [],
      input.targetWeeks,
      source.week_number,
    );

    if (toRemoveIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("sessions")
        .delete()
        .in("id", toRemoveIds);
      if (deleteError) return err(deleteError.message);
    }

    for (const week of toAddWeeks) {
      const result = await copySessionIntoWeek(
        supabase,
        source,
        source.program_id,
        week,
        groupIdsResult.data,
      );
      if (!result.ok) return err(result.error);
    }

    const unlinkResult = await unlinkIfAlone(supabase, source, sessionGroupId);
    if (!unlinkResult.ok) return err(unlinkResult.error);

    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderSessions(
  updates: { id: string; week_number: number; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    // Per-row UPDATEs, not upsert: upsert runs an INSERT ... ON CONFLICT,
    // which still validates NOT NULL columns (sessions.name) against the
    // insert payload even for rows that already exist — so a positions-only
    // upsert fails with "null value in column name". UPDATE only touches
    // the columns we pass. (Same fix as reorderBlocks in block.service.ts.)
    const results = await Promise.all(
      updates.map(({ id, week_number, position }) =>
        supabase
          .from("sessions")
          .update({ week_number, position })
          .eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
