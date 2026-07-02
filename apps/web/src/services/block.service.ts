import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { BlockExerciseRow, BlockRow } from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";

export type CreateBlockInput = { session_id: string; name: string };
export type UpdateBlockInput = { name?: string };

export type AddExerciseToBlockInput = {
  block_id: string;
  exercise_id: string;
  sets?: number;
  unit_type?: string;
  reps?: number;
  value?: number;
  notes?: string;
};

export type UpdateBlockExerciseInput = Partial<
  Omit<AddExerciseToBlockInput, "block_id" | "exercise_id">
>;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function nextBlockPosition(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<number> {
  const { data } = await supabase
    .from("blocks")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

async function nextBlockExercisePosition(
  supabase: SupabaseClient,
  blockId: string,
): Promise<number> {
  const { data } = await supabase
    .from("block_exercises")
    .select("position")
    .eq("block_id", blockId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

/** Falls back to the exercise's first configured unit type, then "Reps". */
async function resolveDefaultUnitType(
  supabase: SupabaseClient,
  exerciseId: string,
): Promise<string> {
  const { data } = await supabase
    .from("exercise_unit_types")
    .select("unit_type")
    .eq("exercise_id", exerciseId)
    .eq("position", 0)
    .maybeSingle();
  return data?.unit_type ?? "Reps";
}

export async function createBlock(
  input: CreateBlockInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const position = await nextBlockPosition(supabase, input.session_id);

    const { data, error } = await supabase
      .from("blocks")
      .insert({
        session_id: input.session_id,
        name: input.name,
        color: defaultBlockColor(input.name),
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

export async function updateBlock(
  id: string,
  input: UpdateBlockInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blocks")
      .update({
        // Color is always derived from the name (never independently set),
        // so a rename recomputes it too.
        ...(input.name !== undefined && {
          name: input.name,
          color: defaultBlockColor(input.name),
        }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteBlock(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("blocks").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlocks(
  updates: { id: string; session_id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    // Per-row UPDATEs, not upsert: upsert runs an INSERT ... ON CONFLICT,
    // which still validates NOT NULL columns (blocks.name) against the
    // insert payload even for rows that already exist — so a positions-only
    // upsert fails with "null value in column name". UPDATE only touches
    // the columns we pass.
    const results = await Promise.all(
      updates.map(({ id, session_id, position }) =>
        supabase.from("blocks").update({ session_id, position }).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addExerciseToBlock(
  input: AddExerciseToBlockInput,
): Promise<Result<BlockExerciseRow>> {
  try {
    const supabase = await createClient();
    const [position, unitType] = await Promise.all([
      nextBlockExercisePosition(supabase, input.block_id),
      input.unit_type
        ? Promise.resolve(input.unit_type)
        : resolveDefaultUnitType(supabase, input.exercise_id),
    ]);

    const { data, error } = await supabase
      .from("block_exercises")
      .insert({
        block_id: input.block_id,
        exercise_id: input.exercise_id,
        position,
        sets: input.sets ?? 1,
        unit_type: unitType,
        reps: input.reps ?? null,
        value: input.value ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateBlockExercise(
  id: string,
  input: UpdateBlockExerciseInput,
): Promise<Result<BlockExerciseRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("block_exercises")
      .update({
        ...(input.sets !== undefined && { sets: input.sets }),
        ...(input.unit_type !== undefined && { unit_type: input.unit_type }),
        ...("reps" in input && { reps: input.reps ?? null }),
        ...("value" in input && { value: input.value ?? null }),
        ...("notes" in input && { notes: input.notes ?? null }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removeExerciseFromBlock(
  id: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("block_exercises")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlockExercises(
  updates: { id: string; block_id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    // Per-row UPDATEs (see reorderBlocks): an upsert would fail the NOT NULL
    // checks on exercise_id / unit_type for the implicit insert path.
    const results = await Promise.all(
      updates.map(({ id, block_id, position }) =>
        supabase
          .from("block_exercises")
          .update({ block_id, position })
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
