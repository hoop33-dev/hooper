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
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteSession(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

type SourceBlockExercise = BlockExerciseRow & {
  block_exercise_measurements: BlockExerciseMeasurementRow[];
};

type SourceSession = SessionRow & {
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

async function copySessionIntoWeek(
  supabase: SupabaseClient,
  source: SourceSession,
  targetWeek: number,
): Promise<Result<SessionRow>> {
  const position = await nextSessionPosition(
    supabase,
    source.program_id,
    targetWeek,
  );

  const { data: newSession, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      program_id: source.program_id,
      week_number: targetWeek,
      name: source.name,
      position,
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
      const result = await copySessionIntoWeek(supabase, source, week);
      if (!result.ok) return err(result.error);
      created.push(result.data);
    }

    return ok(created);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderSessions(
  updates: { id: string; week_number: number; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("sessions").upsert(
      updates.map(({ id, week_number, position }) => ({
        id,
        week_number,
        position,
      })) as unknown as SessionRow[],
      { onConflict: "id" },
    );

    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
