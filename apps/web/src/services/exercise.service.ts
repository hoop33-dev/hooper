import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseStyleRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
  UnitTypeRow,
} from "@hooper/db";

export type CreateExerciseInput = {
  name: string;
  description?: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  categoryIds: string[];
  unitTypeIds: string[];
  /** The base exercise this is a variant of — omit/null for a base exercise. */
  parentId?: string | null;
  defaultStyleId?: string | null;
  created_by: string;
};

export type UpdateExerciseInput = {
  name?: string;
  description?: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  categoryIds: string[];
  unitTypeIds: string[];
  parentId?: string | null;
  defaultStyleId?: string | null;
};

export type RawExercise = ExerciseRow & {
  exercise_category_links: { category_id: string }[];
  exercise_unit_types: { unit_type_id: string; position: number }[];
};

export function toExerciseWithDetails(
  raw: RawExercise,
  allCategories: ExerciseCategoryRow[],
  allStyles: ExerciseStyleRow[],
  allUnitTypes: UnitTypeRow[],
): ExerciseWithDetails {
  const categoryIds = new Set(
    raw.exercise_category_links.map((l) => l.category_id),
  );
  const categories = allCategories.filter((c) => categoryIds.has(c.id));
  const sortedUnitTypeLinks = [...raw.exercise_unit_types].sort(
    (a, b) => a.position - b.position,
  );
  const unitTypeIds = sortedUnitTypeLinks.map((u) => u.unit_type_id);
  const unitTypeById = new Map(allUnitTypes.map((u) => [u.id, u.name]));
  const unitTypes = unitTypeIds
    .map((id) => unitTypeById.get(id))
    .filter(Boolean) as string[];
  const defaultStyle =
    allStyles.find((s) => s.id === raw.default_style_id) ?? null;
  return {
    ...raw,
    categories,
    unitTypes,
    unitTypeIds,
    defaultStyle,
    variants: [],
  };
}

/** Attaches each base exercise's variants (the other exercises whose
 * parent_id points back at it) — single-level, so a variant's own
 * `variants` stays empty. */
function withVariants(exercises: ExerciseWithDetails[]): ExerciseWithDetails[] {
  return exercises.map((ex) =>
    ex.parent_id
      ? ex
      : { ...ex, variants: exercises.filter((v) => v.parent_id === ex.id) },
  );
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
        "*, exercise_category_links(category_id), exercise_unit_types(unit_type_id, position)",
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

    const [{ data: cats }, { data: styles }, { data: unitTypes }] =
      await Promise.all([
        supabase.from("exercise_categories").select("*"),
        supabase.from("exercise_styles").select("*"),
        supabase.from("unit_types").select("*"),
      ]);

    const allCategories = (cats ?? []) as ExerciseCategoryRow[];
    const allStyles = (styles ?? []) as ExerciseStyleRow[];
    const allUnitTypes = (unitTypes ?? []) as UnitTypeRow[];
    const exercises = withVariants(
      (data ?? []).map((raw) =>
        toExerciseWithDetails(
          raw as unknown as RawExercise,
          allCategories,
          allStyles,
          allUnitTypes,
        ),
      ),
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
  unitTypeIds: string[],
): Promise<string | null> {
  if (unitTypeIds.length === 0) return null;
  const { error } = await supabase.from("exercise_unit_types").insert(
    unitTypeIds.map((unit_type_id, position) => ({
      exercise_id: exerciseId,
      unit_type_id,
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
        parent_id: input.parentId ?? null,
        default_style_id: input.defaultStyleId ?? null,
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

    const unitErr = await insertUnitTypes(supabase, data.id, input.unitTypeIds);
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
    if ("parentId" in input) updatePayload.parent_id = input.parentId ?? null;
    if ("defaultStyleId" in input)
      updatePayload.default_style_id = input.defaultStyleId ?? null;

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

    const unitErr = await insertUnitTypes(supabase, id, input.unitTypeIds);
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
