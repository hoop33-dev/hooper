import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  EnteredBy,
  ExerciseCategoryRow,
  SessionTemplateRow,
} from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";
import {
  defaultMeasurementRow,
  resolveConfiguredUnitTypes,
  type SupabaseClient,
} from "./block.service";
import { toExerciseWithDetails } from "./exercise.service";
import {
  TEMPLATE_BLOCK_EXERCISE_SELECT,
  type RawTemplateBlockExercise,
} from "./templateShaping";

export type CreateBlockTemplateInput = {
  session_template_id: string;
  name: string;
};
export type UpdateBlockTemplateInput = { name?: string };

export type MeasurementInput = {
  unit_type: string;
  value?: number | null;
  value_entered_by?: EnteredBy;
  value_unit?: string | null;
};

export type BlockExerciseWithMeasurements = BlockExerciseRow & {
  measurements: BlockExerciseMeasurementRow[];
};

export type AddExerciseToBlockTemplateInput = {
  block_template_id: string;
  exercise_id: string;
  sets?: number;
  notes?: string;
  measurements?: MeasurementInput[];
};

export type UpdateBlockTemplateExerciseInput = {
  sets?: number;
  notes?: string;
  measurements?: MeasurementInput[];
};

async function nextBlockTemplatePosition(
  supabase: SupabaseClient,
  sessionTemplateId: string,
): Promise<number> {
  const { data } = await supabase
    .from("block_templates")
    .select("position")
    .eq("session_template_id", sessionTemplateId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

async function nextBlockTemplateExercisePosition(
  supabase: SupabaseClient,
  blockTemplateId: string,
): Promise<number> {
  const { data } = await supabase
    .from("block_template_exercises")
    .select("position")
    .eq("block_template_id", blockTemplateId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

function toTemplateMeasurementRows(
  blockTemplateExerciseId: string,
  measurements: MeasurementInput[],
) {
  return measurements.map((m, position) => ({
    block_template_exercise_id: blockTemplateExerciseId,
    position,
    unit_type: m.unit_type,
    value: m.value ?? null,
    value_entered_by: m.value_entered_by ?? "coach",
    value_unit: m.value_unit ?? null,
  }));
}

/** Shapes a freshly-inserted block_templates row into the BlockRow type the
 * client-side block components expect (see templateShaping.ts). */
function toBlockRow(row: {
  id: string;
  session_template_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}): BlockRow {
  const { session_template_id, ...rest } = row;
  return { ...rest, session_id: session_template_id, link_group_id: null };
}

function toBlockExerciseWithMeasurements(
  row: {
    id: string;
    block_template_id: string;
    exercise_id: string;
    position: number;
    sets: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
  },
  measurements: BlockExerciseMeasurementRow[],
): BlockExerciseWithMeasurements {
  const { block_template_id, ...rest } = row;
  return {
    ...rest,
    block_id: block_template_id,
    link_group_id: null,
    measurements,
  };
}

export async function createBlockTemplate(
  input: CreateBlockTemplateInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const color = defaultBlockColor(input.name);
    const position = await nextBlockTemplatePosition(
      supabase,
      input.session_template_id,
    );

    const { data, error } = await supabase
      .from("block_templates")
      .insert({
        session_template_id: input.session_template_id,
        name: input.name,
        color,
        position,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(toBlockRow(data));
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateBlockTemplate(
  id: string,
  input: UpdateBlockTemplateInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const patch = {
      ...(input.name !== undefined && {
        name: input.name,
        color: defaultBlockColor(input.name),
      }),
    };

    const { data, error } = await supabase
      .from("block_templates")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(toBlockRow(data));
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteBlockTemplate(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("block_templates")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlockTemplates(
  updates: { id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const results = await Promise.all(
      updates.map(({ id, position }) =>
        supabase.from("block_templates").update({ position }).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addExerciseToBlockTemplate(
  input: AddExerciseToBlockTemplateInput,
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const position = await nextBlockTemplateExercisePosition(
      supabase,
      input.block_template_id,
    );

    const { data: inserted, error } = await supabase
      .from("block_template_exercises")
      .insert({
        block_template_id: input.block_template_id,
        exercise_id: input.exercise_id,
        position,
        sets: input.sets ?? 1,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) return err(error.message);

    const measurements = input.measurements
      ? input.measurements
      : (await resolveConfiguredUnitTypes(supabase, input.exercise_id)).map(
          (unitType, i) => defaultMeasurementRow(unitType, i),
        );

    const { data: insertedMeasurements, error: measurementsError } =
      await supabase
        .from("block_template_exercise_measurements")
        .insert(toTemplateMeasurementRows(inserted.id, measurements))
        .select();
    if (measurementsError) return err(measurementsError.message);

    return ok(
      toBlockExerciseWithMeasurements(
        inserted,
        (insertedMeasurements ?? []).map(
          ({ block_template_exercise_id, ...m }) => ({
            ...m,
            block_exercise_id: block_template_exercise_id,
          }),
        ),
      ),
    );
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateBlockTemplateExercise(
  id: string,
  input: UpdateBlockTemplateExerciseInput,
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const patch = {
      ...(input.sets !== undefined && { sets: input.sets }),
      ...("notes" in input && { notes: input.notes ?? null }),
    };

    const { data: blockTemplateExercise, error } = await supabase
      .from("block_template_exercises")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);

    let measurements: BlockExerciseMeasurementRow[];
    if (input.measurements) {
      const { error: deleteError } = await supabase
        .from("block_template_exercise_measurements")
        .delete()
        .eq("block_template_exercise_id", id);
      if (deleteError) return err(deleteError.message);

      const { data: insertedMeasurements, error: insertError } = await supabase
        .from("block_template_exercise_measurements")
        .insert(toTemplateMeasurementRows(id, input.measurements))
        .select();
      if (insertError) return err(insertError.message);
      measurements = (insertedMeasurements ?? []).map(
        ({ block_template_exercise_id, ...m }) => ({
          ...m,
          block_exercise_id: block_template_exercise_id,
        }),
      );
    } else {
      const { data } = await supabase
        .from("block_template_exercise_measurements")
        .select("*")
        .eq("block_template_exercise_id", id)
        .order("position");
      measurements = (data ?? []).map(
        ({ block_template_exercise_id, ...m }) => ({
          ...m,
          block_exercise_id: block_template_exercise_id,
        }),
      );
    }

    return ok(
      toBlockExerciseWithMeasurements(blockTemplateExercise, measurements),
    );
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removeExerciseFromBlockTemplate(
  id: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("block_template_exercises")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlockTemplateExercises(
  updates: { id: string; block_template_id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const results = await Promise.all(
      updates.map(({ id, block_template_id, position }) =>
        supabase
          .from("block_template_exercises")
          .update({ block_template_id, position })
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

type SourceBlockExercise = {
  exercise_id: string;
  position: number;
  sets: number;
  notes: string | null;
  block_exercise_measurements: {
    position: number;
    unit_type: string;
    value: number | null;
    value_entered_by: EnteredBy;
    value_unit: string | null;
  }[];
};

/** Copies a real block's exercises/measurements into an already-created
 * block_templates row — the shared tail of saveBlockAsTemplate. */
async function copyBlockExercisesIntoTemplate(
  supabase: SupabaseClient,
  blockTemplateId: string,
  sourceExercises: SourceBlockExercise[],
): Promise<Result<void>> {
  if (sourceExercises.length === 0) return ok(undefined);

  const { data: newExercises, error: exercisesError } = await supabase
    .from("block_template_exercises")
    .insert(
      sourceExercises.map((be) => ({
        block_template_id: blockTemplateId,
        exercise_id: be.exercise_id,
        position: be.position,
        sets: be.sets,
        notes: be.notes,
      })),
    )
    .select();
  if (exercisesError) return err(exercisesError.message);

  const measurementRows = sourceExercises.flatMap((be, i) =>
    be.block_exercise_measurements.map((m) => ({
      block_template_exercise_id: newExercises[i].id,
      position: m.position,
      unit_type: m.unit_type,
      value: m.value,
      value_entered_by: m.value_entered_by,
      value_unit: m.value_unit,
    })),
  );
  if (measurementRows.length === 0) return ok(undefined);

  const { error: measurementsError } = await supabase
    .from("block_template_exercise_measurements")
    .insert(measurementRows);
  return measurementsError ? err(measurementsError.message) : ok(undefined);
}

/** Wraps a real block (with its exercises/measurements) into a brand-new
 * one-block template — the "save this block for reuse" entry point. */
export async function saveBlockAsTemplate(
  blockId: string,
  name: string,
  createdBy: string,
): Promise<Result<SessionTemplateRow>> {
  try {
    const supabase = await createClient();
    const { data: blockData, error } = await supabase
      .from("blocks")
      .select("*, block_exercises(*, block_exercise_measurements(*))")
      .eq("id", blockId)
      .single();
    if (error) return err(error.message);
    const block = blockData as unknown as {
      name: string;
      color: string;
      block_exercises: SourceBlockExercise[];
    };

    const { data: sessionTemplate, error: templateError } = await supabase
      .from("session_templates")
      .insert({ name, created_by: createdBy })
      .select()
      .single();
    if (templateError) return err(templateError.message);

    const { data: blockTemplate, error: blockTemplateError } = await supabase
      .from("block_templates")
      .insert({
        session_template_id: sessionTemplate.id,
        name: block.name,
        color: block.color,
        position: 0,
      })
      .select()
      .single();
    if (blockTemplateError) return err(blockTemplateError.message);

    const copyResult = await copyBlockExercisesIntoTemplate(
      supabase,
      blockTemplate.id,
      block.block_exercises,
    );
    if (!copyResult.ok) return err(copyResult.error);

    return ok(sessionTemplate);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export type CreateBlockFromTemplateInput = {
  session_id: string;
  block_template_id: string;
};

/** Copies a template placement's measurements/exercise into a new real
 * block's exercises, fully hydrated — the shared tail of
 * createBlockFromTemplate. */
async function copyTemplateExercisesIntoBlock(
  supabase: SupabaseClient,
  newBlockId: string,
  sourceExercises: RawTemplateBlockExercise[],
): Promise<Result<BlockExerciseWithDetails[]>> {
  if (sourceExercises.length === 0) return ok([]);

  const { data: newExercises, error: exercisesError } = await supabase
    .from("block_exercises")
    .insert(
      sourceExercises.map((be) => ({
        block_id: newBlockId,
        exercise_id: be.exercise_id,
        position: be.position,
        sets: be.sets,
        notes: be.notes,
      })),
    )
    .select();
  if (exercisesError) return err(exercisesError.message);

  const measurementRows = sourceExercises.flatMap((be, i) =>
    be.block_template_exercise_measurements.map((m) => ({
      block_exercise_id: newExercises[i].id,
      position: m.position,
      unit_type: m.unit_type,
      value: m.value,
      value_entered_by: m.value_entered_by,
      value_unit: m.value_unit,
    })),
  );
  const { data: insertedMeasurements, error: measurementsError } =
    await supabase
      .from("block_exercise_measurements")
      .insert(measurementRows)
      .select();
  if (measurementsError) return err(measurementsError.message);

  const { data: cats } = await supabase.from("exercise_categories").select("*");
  const allCategories = (cats ?? []) as ExerciseCategoryRow[];

  return ok(
    sourceExercises.map((be, i) => ({
      ...newExercises[i],
      exercise: toExerciseWithDetails(be.exercise, allCategories),
      measurements: (insertedMeasurements ?? []).filter(
        (m) => m.block_exercise_id === newExercises[i].id,
      ),
    })),
  );
}

/** Copies a block template's exercises/measurements into a new real block
 * in one round trip, fully hydrated for optimistic UI (drag-and-drop insert
 * from the Block Library panel). */
export async function createBlockFromTemplate(
  input: CreateBlockFromTemplateInput,
): Promise<Result<BlockWithExercises>> {
  try {
    const supabase = await createClient();
    const { data: rawBlockTemplate, error } = await supabase
      .from("block_templates")
      .select(`*, block_template_exercises(${TEMPLATE_BLOCK_EXERCISE_SELECT})`)
      .eq("id", input.block_template_id)
      .single();
    if (error) return err(error.message);
    const blockTemplate = rawBlockTemplate as unknown as {
      name: string;
      color: string;
      block_template_exercises: RawTemplateBlockExercise[];
    };

    const sourceExercises = [...blockTemplate.block_template_exercises].sort(
      (a, b) => a.position - b.position,
    );

    const { data: nextPos } = await supabase
      .from("blocks")
      .select("position")
      .eq("session_id", input.session_id)
      .order("position", { ascending: false })
      .limit(1);
    const position =
      nextPos && nextPos.length > 0 ? nextPos[0].position + 1 : 0;

    const { data: newBlock, error: blockError } = await supabase
      .from("blocks")
      .insert({
        session_id: input.session_id,
        name: blockTemplate.name,
        color: blockTemplate.color,
        position,
      })
      .select()
      .single();
    if (blockError) return err(blockError.message);

    const exercisesResult = await copyTemplateExercisesIntoBlock(
      supabase,
      newBlock.id,
      sourceExercises,
    );
    if (!exercisesResult.ok) return err(exercisesResult.error);

    return ok({ ...newBlock, exercises: exercisesResult.data });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
