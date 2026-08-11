import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockExerciseWithDetails,
  BlockRow,
  BlockTemplateExerciseMeasurementRow,
  BlockWithExercises,
  EnteredBy,
  ExerciseCategoryRow,
  ExerciseStyleRow,
  SessionTemplateRow,
} from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";
import {
  defaultMeasurementInput,
  resolveConfiguredUnitTypes,
  type MeasurementInput,
  type SupabaseClient,
} from "./block.service";
import { toExerciseWithDetails } from "./exercise.service";
import {
  TEMPLATE_BLOCK_EXERCISE_SELECT,
  type RawTemplateBlockExercise,
} from "./templateShaping";

export type { MeasurementInput, MeasurementSetInput } from "./block.service";

export type CreateBlockTemplateInput = {
  session_template_id: string;
  name: string;
};
export type UpdateBlockTemplateInput = {
  name?: string;
  is_superset?: boolean;
  sets?: number;
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
  return measurements.flatMap((m, position) =>
    m.sets.map((s, set_index) => ({
      block_template_exercise_id: blockTemplateExerciseId,
      position,
      set_index,
      unit_type: m.unit_type,
      value: s.value ?? null,
      value_entered_by: s.value_entered_by ?? "coach",
      value_unit: m.value_unit ?? null,
    })),
  );
}

/** Shapes a freshly-inserted block_templates row into the BlockRow type the
 * client-side block components expect (see templateShaping.ts). */
function toBlockRow(row: {
  id: string;
  session_template_id: string;
  name: string;
  color: string;
  position: number;
  is_superset: boolean;
  sets: number | null;
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
    // Block templates have no style_id column of their own.
    style_id: null,
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

/** Template-editor sibling of block.service.ts's resizeMeasurements —
 * groups a placement's raw measurement rows by unit-type slot, sorted by
 * set_index, so a slot's values can be padded/truncated to a new sets
 * count. */
function groupTemplateMeasurementsByPosition(
  measurements: BlockTemplateExerciseMeasurementRow[],
): BlockTemplateExerciseMeasurementRow[][] {
  const byPosition = new Map<number, BlockTemplateExerciseMeasurementRow[]>();
  for (const m of measurements) {
    const list = byPosition.get(m.position) ?? [];
    list.push(m);
    byPosition.set(m.position, list);
  }
  return [...byPosition.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, rows]) => [...rows].sort((a, b) => a.set_index - b.set_index));
}

function resizeTemplateMeasurements(
  measurements: BlockTemplateExerciseMeasurementRow[],
  setsCount: number,
): MeasurementInput[] {
  return groupTemplateMeasurementsByPosition(measurements).map((rows) => {
    const last = rows[rows.length - 1];
    return {
      unit_type: rows[0].unit_type,
      value_unit: rows[0].value_unit,
      sets: Array.from({ length: setsCount }, (_, i) => {
        const row = rows[i] ?? last;
        return {
          value: row?.value ?? null,
          value_entered_by: row?.value_entered_by ?? "coach",
        };
      }),
    };
  });
}

/** Template-editor sibling of block.service.ts's cascadeSupersetSets. */
async function cascadeTemplateSupersetSets(
  supabase: SupabaseClient,
  blockTemplateId: string,
  newSets: number,
): Promise<Result<void>> {
  const { data: rawExercises, error } = await supabase
    .from("block_template_exercises")
    .select("*, block_template_exercise_measurements(*)")
    .eq("block_template_id", blockTemplateId);
  if (error) return err(error.message);

  const exercises = (rawExercises ?? []) as unknown as {
    id: string;
    block_template_exercise_measurements: BlockTemplateExerciseMeasurementRow[];
  }[];

  for (const be of exercises) {
    const { error: setsError } = await supabase
      .from("block_template_exercises")
      .update({ sets: newSets })
      .eq("id", be.id);
    if (setsError) return err(setsError.message);

    const { error: deleteError } = await supabase
      .from("block_template_exercise_measurements")
      .delete()
      .eq("block_template_exercise_id", be.id);
    if (deleteError) return err(deleteError.message);

    const resized = resizeTemplateMeasurements(
      be.block_template_exercise_measurements ?? [],
      newSets,
    );
    const { error: insertError } = await supabase
      .from("block_template_exercise_measurements")
      .insert(toTemplateMeasurementRows(be.id, resized));
    if (insertError) return err(insertError.message);
  }
  return ok(undefined);
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
      ...(input.is_superset !== undefined && {
        is_superset: input.is_superset,
      }),
      ...(input.sets !== undefined && { sets: input.sets }),
    };

    const { data, error } = await supabase
      .from("block_templates")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    if (input.sets !== undefined && data.is_superset) {
      const cascadeResult = await cascadeTemplateSupersetSets(
        supabase,
        id,
        input.sets,
      );
      if (!cascadeResult.ok) return err(cascadeResult.error);
    }

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

    const { data: parentBlockTemplate } = await supabase
      .from("block_templates")
      .select("is_superset, sets")
      .eq("id", input.block_template_id)
      .single();
    const setsCount =
      parentBlockTemplate?.is_superset && parentBlockTemplate.sets
        ? parentBlockTemplate.sets
        : (input.sets ?? 1);

    const { data: inserted, error } = await supabase
      .from("block_template_exercises")
      .insert({
        block_template_id: input.block_template_id,
        exercise_id: input.exercise_id,
        position,
        sets: setsCount,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) return err(error.message);

    const measurements = input.measurements
      ? input.measurements
      : (await resolveConfiguredUnitTypes(supabase, input.exercise_id)).map(
          (unitType) => defaultMeasurementInput(unitType, setsCount),
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

    // A measurements-only save leaves patch empty — an empty .update()
    // still hits PostgREST and comes back with no row for .single() to
    // coerce, so skip straight to a plain select in that case.
    const { data: blockTemplateExercise, error } =
      Object.keys(patch).length > 0
        ? await supabase
            .from("block_template_exercises")
            .update(patch)
            .eq("id", id)
            .select()
            .single()
        : await supabase
            .from("block_template_exercises")
            .select()
            .eq("id", id)
            .single();
    if (error) return err(error.message);

    async function replaceTemplateMeasurements(
      newMeasurements: MeasurementInput[],
    ): Promise<BlockExerciseMeasurementRow[]> {
      const { error: deleteError } = await supabase
        .from("block_template_exercise_measurements")
        .delete()
        .eq("block_template_exercise_id", id);
      if (deleteError) throw new Error(deleteError.message);

      const { data: insertedMeasurements, error: insertError } = await supabase
        .from("block_template_exercise_measurements")
        .insert(toTemplateMeasurementRows(id, newMeasurements))
        .select();
      if (insertError) throw new Error(insertError.message);
      return (insertedMeasurements ?? []).map(
        ({ block_template_exercise_id, ...m }) => ({
          ...m,
          block_exercise_id: block_template_exercise_id,
        }),
      );
    }

    let measurements: BlockExerciseMeasurementRow[];
    if (input.measurements) {
      measurements = await replaceTemplateMeasurements(input.measurements);
    } else if (input.sets !== undefined) {
      const { data: existing } = await supabase
        .from("block_template_exercise_measurements")
        .select("*")
        .eq("block_template_exercise_id", id)
        .order("position")
        .order("set_index");
      measurements = await replaceTemplateMeasurements(
        resizeTemplateMeasurements(
          (existing ?? []) as BlockTemplateExerciseMeasurementRow[],
          input.sets,
        ),
      );
    } else {
      const { data } = await supabase
        .from("block_template_exercise_measurements")
        .select("*")
        .eq("block_template_exercise_id", id)
        .order("position")
        .order("set_index");
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
    set_index: number;
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
      set_index: m.set_index,
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
      is_superset: boolean;
      sets: number | null;
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
        is_superset: block.is_superset,
        sets: block.sets,
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
        style_id: be.exercise.default_style_id,
      })),
    )
    .select();
  if (exercisesError) return err(exercisesError.message);

  const measurementRows = sourceExercises.flatMap((be, i) =>
    be.block_template_exercise_measurements.map((m) => ({
      block_exercise_id: newExercises[i].id,
      position: m.position,
      set_index: m.set_index,
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

  const [{ data: cats }, { data: styles }] = await Promise.all([
    supabase.from("exercise_categories").select("*"),
    supabase.from("exercise_styles").select("*"),
  ]);
  const allCategories = (cats ?? []) as ExerciseCategoryRow[];
  const allStyles = (styles ?? []) as ExerciseStyleRow[];

  return ok(
    sourceExercises.map((be, i) => ({
      ...newExercises[i],
      exercise: toExerciseWithDetails(be.exercise, allCategories, allStyles),
      measurements: (insertedMeasurements ?? []).filter(
        (m) => m.block_exercise_id === newExercises[i].id,
      ),
      // Per-set variant overrides aren't copied when a block template is
      // instantiated — a coach can add them fresh in the new placement.
      setVariants: {},
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
      is_superset: boolean;
      sets: number | null;
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
        is_superset: blockTemplate.is_superset,
        sets: blockTemplate.sets,
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

export type CreateBlockTemplateFromTemplateInput = {
  session_template_id: string;
  block_template_id: string;
};

/** Copies a template placement's measurements/exercise into a new sibling
 * block template's exercises, fully hydrated — the template-editor sibling
 * of copyTemplateExercisesIntoBlock (targets block_template_exercises
 * instead of block_exercises). */
async function copyTemplateExercisesIntoBlockTemplate(
  supabase: SupabaseClient,
  newBlockTemplateId: string,
  sourceExercises: RawTemplateBlockExercise[],
): Promise<Result<BlockExerciseWithDetails[]>> {
  if (sourceExercises.length === 0) return ok([]);

  const { data: newExercises, error: exercisesError } = await supabase
    .from("block_template_exercises")
    .insert(
      sourceExercises.map((be) => ({
        block_template_id: newBlockTemplateId,
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
      block_template_exercise_id: newExercises[i].id,
      position: m.position,
      set_index: m.set_index,
      unit_type: m.unit_type,
      value: m.value,
      value_entered_by: m.value_entered_by,
      value_unit: m.value_unit,
    })),
  );
  const { data: insertedMeasurements, error: measurementsError } =
    await supabase
      .from("block_template_exercise_measurements")
      .insert(measurementRows)
      .select();
  if (measurementsError) return err(measurementsError.message);

  const [{ data: cats }, { data: styles }] = await Promise.all([
    supabase.from("exercise_categories").select("*"),
    supabase.from("exercise_styles").select("*"),
  ]);
  const allCategories = (cats ?? []) as ExerciseCategoryRow[];
  const allStyles = (styles ?? []) as ExerciseStyleRow[];

  return ok(
    sourceExercises.map((be, i) => ({
      ...toBlockExerciseWithMeasurements(
        newExercises[i],
        (insertedMeasurements ?? [])
          .filter((m) => m.block_template_exercise_id === newExercises[i].id)
          .map(({ block_template_exercise_id, ...m }) => ({
            ...m,
            block_exercise_id: block_template_exercise_id,
          })),
      ),
      exercise: toExerciseWithDetails(be.exercise, allCategories, allStyles),
      setVariants: {},
    })),
  );
}

/** Copies a block template's exercises/measurements into a new sibling block
 * template in one round trip, fully hydrated — the template-editor sibling
 * of createBlockFromTemplate (drag-and-drop insert from the Block Library
 * panel into the template editor itself, rather than into a real session). */
export async function createBlockTemplateFromTemplate(
  input: CreateBlockTemplateFromTemplateInput,
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
      is_superset: boolean;
      sets: number | null;
      block_template_exercises: RawTemplateBlockExercise[];
    };

    const sourceExercises = [...blockTemplate.block_template_exercises].sort(
      (a, b) => a.position - b.position,
    );

    const position = await nextBlockTemplatePosition(
      supabase,
      input.session_template_id,
    );

    const { data: newBlockTemplate, error: blockError } = await supabase
      .from("block_templates")
      .insert({
        session_template_id: input.session_template_id,
        name: blockTemplate.name,
        color: blockTemplate.color,
        position,
        is_superset: blockTemplate.is_superset,
        sets: blockTemplate.sets,
      })
      .select()
      .single();
    if (blockError) return err(blockError.message);

    const exercisesResult = await copyTemplateExercisesIntoBlockTemplate(
      supabase,
      newBlockTemplate.id,
      sourceExercises,
    );
    if (!exercisesResult.ok) return err(exercisesResult.error);

    return ok({
      ...toBlockRow(newBlockTemplate),
      exercises: exercisesResult.data,
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

async function orderedBlockTemplateIds(
  supabase: SupabaseClient,
  sessionTemplateId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("block_templates")
    .select("id")
    .eq("session_template_id", sessionTemplateId)
    .order("position");
  return (data ?? []).map((b) => b.id);
}

export type CreateBlocksFromSessionTemplateInput = {
  session_id: string;
  session_template_id: string;
};

/** Copies every block of a multi-block template into an existing real
 * session — the multi-block sibling of createBlockFromTemplate, used when a
 * multi-block template is dragged straight into a session rather than
 * "+ Add session > From template" (which creates a whole new session; see
 * createSessionFromTemplate). Blocks are copied one at a time, in order, so
 * each lands right after the last. */
export async function createBlocksFromSessionTemplate(
  input: CreateBlocksFromSessionTemplateInput,
): Promise<Result<BlockWithExercises[]>> {
  const supabase = await createClient();
  const blockTemplateIds = await orderedBlockTemplateIds(
    supabase,
    input.session_template_id,
  );

  const results: BlockWithExercises[] = [];
  for (const blockTemplateId of blockTemplateIds) {
    const result = await createBlockFromTemplate({
      session_id: input.session_id,
      block_template_id: blockTemplateId,
    });
    if (!result.ok) return err(result.error);
    results.push(result.data);
  }
  return ok(results);
}

export type CreateBlockTemplatesFromSessionTemplateInput = {
  session_template_id: string;
  source_session_template_id: string;
};

/** Copies every block of another (multi-block) template into this one — the
 * multi-block sibling of createBlockTemplateFromTemplate, used when a
 * multi-block template is dragged into the template editor itself. Blocks
 * are copied one at a time, in order, so each lands right after the last. */
export async function createBlockTemplatesFromSessionTemplate(
  input: CreateBlockTemplatesFromSessionTemplateInput,
): Promise<Result<BlockWithExercises[]>> {
  const supabase = await createClient();
  const blockTemplateIds = await orderedBlockTemplateIds(
    supabase,
    input.source_session_template_id,
  );

  const results: BlockWithExercises[] = [];
  for (const blockTemplateId of blockTemplateIds) {
    const result = await createBlockTemplateFromTemplate({
      session_template_id: input.session_template_id,
      block_template_id: blockTemplateId,
    });
    if (!result.ok) return err(result.error);
    results.push(result.data);
  }
  return ok(results);
}
