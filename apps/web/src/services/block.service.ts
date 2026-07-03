import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  EnteredBy,
} from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";

export type CreateBlockInput = { session_id: string; name: string };
export type UpdateBlockInput = { name?: string };

export type MeasurementInput = {
  unit_type: string;
  value?: number | null;
  value_entered_by?: EnteredBy;
  value_unit?: string | null;
};

export type BlockExerciseWithMeasurements = BlockExerciseRow & {
  measurements: BlockExerciseMeasurementRow[];
};

export type AddExerciseToBlockInput = {
  block_id: string;
  exercise_id: string;
  sets?: number;
  notes?: string;
  /** Omitted → auto-derive one measurement per the exercise's configured
   * exercise_unit_types (see resolveConfiguredUnitTypes). */
  measurements?: MeasurementInput[];
};

export type UpdateBlockExerciseInput = {
  sets?: number;
  notes?: string;
  /** When provided, fully replaces this placement's measurement rows. */
  measurements?: MeasurementInput[];
};

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

/** All of the exercise's configured unit types, in order, falling back to
 * "Reps" if none are configured. */
async function resolveConfiguredUnitTypes(
  supabase: SupabaseClient,
  exerciseId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("exercise_unit_types")
    .select("unit_type")
    .eq("exercise_id", exerciseId)
    .order("position");
  const types = (data ?? []).map((row) => row.unit_type);
  return types.length > 0 ? types : ["Reps"];
}

/** Reps-like unit types default to a nonzero starting count; everything
 * else (Weight, Time, Distance, RPE, Shots, Makes, % 1RM) starts at zero. */
function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 8 : 0;
}

/** Sensible starting values for a freshly-placed measurement: coach-entered,
 * with a default value and default display unit for this unit type. */
function defaultMeasurementRow(unitType: string, position: number) {
  return {
    position,
    unit_type: unitType,
    value: defaultValueFor(unitType),
    value_entered_by: "coach" as const,
    value_unit: defaultUnitFor(unitType),
  };
}

function toMeasurementRows(
  blockExerciseId: string,
  measurements: MeasurementInput[],
) {
  return measurements.map((m, position) => ({
    block_exercise_id: blockExerciseId,
    position,
    unit_type: m.unit_type,
    value: m.value ?? null,
    value_entered_by: m.value_entered_by ?? "coach",
    value_unit: m.value_unit ?? defaultUnitFor(m.unit_type),
  }));
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
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const position = await nextBlockExercisePosition(supabase, input.block_id);

    const { data: blockExercise, error } = await supabase
      .from("block_exercises")
      .insert({
        block_id: input.block_id,
        exercise_id: input.exercise_id,
        position,
        sets: input.sets ?? 1,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) return err(error.message);

    const measurementRows = input.measurements
      ? toMeasurementRows(blockExercise.id, input.measurements)
      : (await resolveConfiguredUnitTypes(supabase, input.exercise_id)).map(
          (unitType, i) => ({
            block_exercise_id: blockExercise.id,
            ...defaultMeasurementRow(unitType, i),
          }),
        );

    const { data: measurements, error: measurementsError } = await supabase
      .from("block_exercise_measurements")
      .insert(measurementRows)
      .select();

    if (measurementsError) return err(measurementsError.message);
    return ok({ ...blockExercise, measurements: measurements ?? [] });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateBlockExercise(
  id: string,
  input: UpdateBlockExerciseInput,
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const { data: blockExercise, error } = await supabase
      .from("block_exercises")
      .update({
        ...(input.sets !== undefined && { sets: input.sets }),
        ...("notes" in input && { notes: input.notes ?? null }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    let measurements: BlockExerciseMeasurementRow[];
    if (input.measurements) {
      // Full replace, matching exercise.service.ts's delete-then-reinsert
      // convention for exercise_unit_types: the modal always submits the
      // complete set of active measurements for this placement.
      const { error: deleteError } = await supabase
        .from("block_exercise_measurements")
        .delete()
        .eq("block_exercise_id", id);
      if (deleteError) return err(deleteError.message);

      const { data: inserted, error: insertError } = await supabase
        .from("block_exercise_measurements")
        .insert(toMeasurementRows(id, input.measurements))
        .select();
      if (insertError) return err(insertError.message);
      measurements = inserted ?? [];
    } else {
      const { data } = await supabase
        .from("block_exercise_measurements")
        .select("*")
        .eq("block_exercise_id", id)
        .order("position");
      measurements = data ?? [];
    }

    return ok({ ...blockExercise, measurements });
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
    // checks on exercise_id for the implicit insert path.
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
