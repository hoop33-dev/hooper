import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
} from "@hooper/db";

export type CreateExerciseInput = {
  name: string;
  description?: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  categoryIds: string[];
  unitTypes: string[];
  created_by: string;
};

export type UpdateExerciseInput = {
  name?: string;
  description?: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  categoryIds: string[];
  unitTypes: string[];
};

export type RawExercise = ExerciseRow & {
  exercise_category_links: { category_id: string }[];
  exercise_unit_types: { unit_type: string; position: number }[];
};

export function toExerciseWithDetails(
  raw: RawExercise,
  allCategories: ExerciseCategoryRow[],
): ExerciseWithDetails {
  const categoryIds = new Set(
    raw.exercise_category_links.map((l) => l.category_id),
  );
  const categories = allCategories.filter((c) => categoryIds.has(c.id));
  const unitTypes = [...raw.exercise_unit_types]
    .sort((a, b) => a.position - b.position)
    .map((u) => u.unit_type);
  return { ...raw, categories, unitTypes };
}

export type ExerciseListOptions = {
  search?: string;
  categoryId?: string;
};

export async function listExercises(
  opts?: ExerciseListOptions,
): Promise<Result<ExerciseWithDetails[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("exercises")
      .select(
        "*, exercise_category_links(category_id), exercise_unit_types(unit_type, position)",
      )
      .order("name");

    if (opts?.search) {
      query = query.ilike("name", `%${opts.search}%`);
    }

    if (opts?.categoryId) {
      query = query.in(
        "id",
        supabase
          .from("exercise_category_links")
          .select("exercise_id")
          .eq("category_id", opts.categoryId) as unknown as string[],
      );
    }

    const { data, error } = await query;
    if (error) return err(error.message);

    const { data: cats } = await supabase
      .from("exercise_categories")
      .select("*");

    const allCategories = (cats ?? []) as ExerciseCategoryRow[];
    const exercises = (data ?? []).map((raw) =>
      toExerciseWithDetails(raw as unknown as RawExercise, allCategories),
    );

    return ok(exercises);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

async function insertCategoryLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  categoryIds: string[],
): Promise<string | null> {
  if (categoryIds.length === 0) return null;
  const { error } = await supabase.from("exercise_category_links").insert(
    categoryIds.map((category_id) => ({
      exercise_id: exerciseId,
      category_id,
    })),
  );
  return error?.message ?? null;
}

async function insertUnitTypes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  unitTypes: string[],
): Promise<string | null> {
  if (unitTypes.length === 0) return null;
  const { error } = await supabase.from("exercise_unit_types").insert(
    unitTypes.map((unit_type, position) => ({
      exercise_id: exerciseId,
      unit_type,
      position,
    })),
  );
  return error?.message ?? null;
}

export async function createExercise(
  input: CreateExerciseInput,
): Promise<Result<ExerciseRow>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("exercises")
      .insert({
        name: input.name,
        description: input.description ?? null,
        video_url: input.videoUrl ?? null,
        video_source: input.videoSource ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) return err(error.message);

    const linkErr = await insertCategoryLinks(
      supabase,
      data.id,
      input.categoryIds,
    );
    if (linkErr) return err(linkErr);

    const unitErr = await insertUnitTypes(supabase, data.id, input.unitTypes);
    if (unitErr) return err(unitErr);

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateExercise(
  id: string,
  input: UpdateExerciseInput,
): Promise<Result<ExerciseRow>> {
  try {
    const supabase = await createClient();

    const updatePayload: Partial<ExerciseRow> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.description !== undefined)
      updatePayload.description = input.description;
    if ("videoUrl" in input) {
      updatePayload.video_url = input.videoUrl ?? null;
      updatePayload.video_source = input.videoSource ?? null;
    }

    const { data, error } = await supabase
      .from("exercises")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    await supabase
      .from("exercise_category_links")
      .delete()
      .eq("exercise_id", id);
    await supabase.from("exercise_unit_types").delete().eq("exercise_id", id);

    const linkErr = await insertCategoryLinks(supabase, id, input.categoryIds);
    if (linkErr) return err(linkErr);

    const unitErr = await insertUnitTypes(supabase, id, input.unitTypes);
    if (unitErr) return err(unitErr);

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteExercise(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateExerciseVideoUrl(
  id: string,
  videoUrl: string,
  videoSource: ExerciseVideoSource,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("exercises")
      .update({ video_url: videoUrl, video_source: videoSource })
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
