import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  EnteredBy,
  ExerciseCategoryRow,
  SessionRow,
  SessionTemplateRow,
  SessionTemplateSummary,
  SessionTemplateWithBlocks,
} from "@hooper/db";
import type { SupabaseClient } from "./block.service";
import {
  SESSION_TEMPLATE_SELECT,
  shapeSessionTemplate,
  type RawSessionTemplate,
} from "./templateShaping";

export type CreateSessionTemplateInput = { name: string; created_by: string };

export type CreateSessionFromTemplateInput = {
  session_template_id: string;
  program_id: string;
  week_number: number;
};

export async function listSessionTemplates(): Promise<
  Result<SessionTemplateSummary[]>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_templates")
      .select("*, block_templates(id, name, block_template_exercises(count))")
      .order("updated_at", { ascending: false });
    if (error) return err(error.message);

    type RawSummaryBlock = {
      id: string;
      name: string;
      block_template_exercises: { count: number }[] | { count: number };
    };
    const templates = (data ?? []).map(({ block_templates, ...t }) => ({
      ...t,
      blocks: (block_templates as unknown as RawSummaryBlock[]).map((b) => ({
        id: b.id,
        name: b.name,
        exerciseCount: Array.isArray(b.block_template_exercises)
          ? (b.block_template_exercises[0]?.count ?? 0)
          : (b.block_template_exercises?.count ?? 0),
      })),
    }));
    return ok(templates as SessionTemplateSummary[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getSessionTemplateById(
  id: string,
): Promise<Result<SessionTemplateWithBlocks>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_templates")
      .select(SESSION_TEMPLATE_SELECT)
      .eq("id", id)
      .single();
    if (error) return err(error.message);

    const { data: cats } = await supabase
      .from("exercise_categories")
      .select("*");
    const allCategories = (cats ?? []) as ExerciseCategoryRow[];

    return ok(
      shapeSessionTemplate(
        data as unknown as RawSessionTemplate,
        allCategories,
      ),
    );
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createSessionTemplate(
  input: CreateSessionTemplateInput,
): Promise<Result<SessionTemplateRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_templates")
      .insert({ name: input.name, created_by: input.created_by })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateSessionTemplateName(
  id: string,
  name: string,
): Promise<Result<SessionTemplateRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_templates")
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

export async function deleteSessionTemplate(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("session_templates")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
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
type SourceBlock = {
  id: string;
  name: string;
  color: string;
  position: number;
  block_exercises: SourceBlockExercise[];
};
type SourceSession = SessionRow & { blocks: SourceBlock[] };

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

/** Copies a real session's blocks/exercises/measurements into a brand-new
 * template — the "save this session for reuse" entry point. */
export async function saveSessionAsTemplate(
  sessionId: string,
  name: string,
  createdBy: string,
): Promise<Result<SessionTemplateRow>> {
  try {
    const supabase = await createClient();
    const source = await fetchSourceSession(supabase, sessionId);
    if (!source) return err("Session not found.");

    const { data: sessionTemplate, error: templateError } = await supabase
      .from("session_templates")
      .insert({ name, created_by: createdBy })
      .select()
      .single();
    if (templateError) return err(templateError.message);

    if (source.blocks.length === 0) return ok(sessionTemplate);

    const { data: newBlockTemplates, error: blocksError } = await supabase
      .from("block_templates")
      .insert(
        source.blocks.map((block) => ({
          session_template_id: sessionTemplate.id,
          name: block.name,
          color: block.color,
          position: block.position,
        })),
      )
      .select();
    if (blocksError) return err(blocksError.message);

    const blockExerciseRows = source.blocks.flatMap((block, i) =>
      block.block_exercises.map((be) => ({
        block_template_id: newBlockTemplates[i].id,
        exercise_id: be.exercise_id,
        position: be.position,
        sets: be.sets,
        notes: be.notes,
      })),
    );
    if (blockExerciseRows.length === 0) return ok(sessionTemplate);

    const { data: newBlockExercises, error: exercisesError } = await supabase
      .from("block_template_exercises")
      .insert(blockExerciseRows)
      .select();
    if (exercisesError) return err(exercisesError.message);

    const sourceBlockExercises = source.blocks.flatMap(
      (block) => block.block_exercises,
    );
    const measurementRows = sourceBlockExercises.flatMap((be, i) =>
      be.block_exercise_measurements.map((m) => ({
        block_template_exercise_id: newBlockExercises[i].id,
        position: m.position,
        unit_type: m.unit_type,
        value: m.value,
        value_entered_by: m.value_entered_by,
        value_unit: m.value_unit,
      })),
    );
    if (measurementRows.length > 0) {
      const { error: measurementsError } = await supabase
        .from("block_template_exercise_measurements")
        .insert(measurementRows);
      if (measurementsError) return err(measurementsError.message);
    }

    return ok(sessionTemplate);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

type SourceTemplateBlockExercise = {
  exercise_id: string;
  position: number;
  sets: number;
  notes: string | null;
  block_template_exercise_measurements: {
    position: number;
    unit_type: string;
    value: number | null;
    value_entered_by: EnteredBy;
    value_unit: string | null;
  }[];
};
type SourceTemplateBlock = {
  id: string;
  name: string;
  color: string;
  position: number;
  block_template_exercises: SourceTemplateBlockExercise[];
};
type SourceSessionTemplate = SessionTemplateRow & {
  block_templates: SourceTemplateBlock[];
};

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

/** Copies a template's blocks (and their exercises/measurements) into an
 * already-created real session — the shared tail of
 * createSessionFromTemplate. */
async function copyTemplateBlocksIntoSession(
  supabase: SupabaseClient,
  newSessionId: string,
  sourceBlockTemplates: SourceTemplateBlock[],
): Promise<Result<void>> {
  if (sourceBlockTemplates.length === 0) return ok(undefined);

  const { data: newBlocks, error: blocksError } = await supabase
    .from("blocks")
    .insert(
      sourceBlockTemplates.map((block) => ({
        session_id: newSessionId,
        name: block.name,
        color: block.color,
        position: block.position,
      })),
    )
    .select();
  if (blocksError) return err(blocksError.message);

  const blockExerciseRows = sourceBlockTemplates.flatMap((block, i) =>
    block.block_template_exercises.map((be) => ({
      block_id: newBlocks[i].id,
      exercise_id: be.exercise_id,
      position: be.position,
      sets: be.sets,
      notes: be.notes,
    })),
  );
  if (blockExerciseRows.length === 0) return ok(undefined);

  const { data: newBlockExercises, error: exercisesError } = await supabase
    .from("block_exercises")
    .insert(blockExerciseRows)
    .select();
  if (exercisesError) return err(exercisesError.message);

  const sourceBlockExercises = sourceBlockTemplates.flatMap(
    (block) => block.block_template_exercises,
  );
  const measurementRows = sourceBlockExercises.flatMap((be, i) =>
    be.block_template_exercise_measurements.map((m) => ({
      block_exercise_id: newBlockExercises[i].id,
      position: m.position,
      unit_type: m.unit_type,
      value: m.value,
      value_entered_by: m.value_entered_by,
      value_unit: m.value_unit,
    })),
  );
  if (measurementRows.length === 0) return ok(undefined);

  const { error: measurementsError } = await supabase
    .from("block_exercise_measurements")
    .insert(measurementRows);
  return measurementsError ? err(measurementsError.message) : ok(undefined);
}

/** Copies a template's blocks/exercises/measurements into a brand-new real
 * session — the "+ Add session > From template" entry point. Never linked:
 * this is always a fresh, independent copy. */
export async function createSessionFromTemplate(
  input: CreateSessionFromTemplateInput,
): Promise<Result<SessionRow>> {
  try {
    const supabase = await createClient();
    const { data: template, error } = await supabase
      .from("session_templates")
      .select(
        "*, block_templates(*, block_template_exercises(*, block_template_exercise_measurements(*)))",
      )
      .eq("id", input.session_template_id)
      .single();
    if (error) return err(error.message);
    const source = template as unknown as SourceSessionTemplate;

    const position = await nextSessionPosition(
      supabase,
      input.program_id,
      input.week_number,
    );

    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        program_id: input.program_id,
        week_number: input.week_number,
        name: source.name,
        position,
      })
      .select()
      .single();
    if (sessionError) return err(sessionError.message);

    const copyResult = await copyTemplateBlocksIntoSession(
      supabase,
      newSession.id,
      source.block_templates,
    );
    if (!copyResult.ok) return err(copyResult.error);

    return ok(newSession);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
