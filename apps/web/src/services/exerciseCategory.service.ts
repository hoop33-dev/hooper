import type { ExerciseCategoryRow, ExerciseCategoryWithCount } from "@hooper/db";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import type { Result } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";

export type CreateCategoryInput = {
  name: string;
  description?: string;
  parent_id?: string;
  created_by: string;
};

export type UpdateCategoryInput = {
  name?: string;
  description?: string;
  parent_id?: string | null;
};

export async function listCategories(): Promise<
  Result<ExerciseCategoryWithCount[]>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exercise_categories")
      .select(
        "*, exercise_category_links(count)",
      )
      .order("parent_id", { nullsFirst: true })
      .order("position");

    if (error) return err(error.message);

    const rows = (data ?? []).map((row) => ({
      ...row,
      exercise_count: Array.isArray(row.exercise_category_links)
        ? (row.exercise_category_links[0] as { count: number } | undefined)
            ?.count ?? 0
        : 0,
    }));

    return ok(rows as ExerciseCategoryWithCount[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getCategoryById(
  id: string,
): Promise<Result<ExerciseCategoryRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exercise_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Result<ExerciseCategoryRow>> {
  try {
    const supabase = await createClient();

    const siblingsBase = supabase
      .from("exercise_categories")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);
    const { data: siblings } = await (
      input.parent_id
        ? siblingsBase.eq("parent_id", input.parent_id)
        : siblingsBase.is("parent_id", null)
    );

    const nextPosition =
      siblings && siblings.length > 0 ? siblings[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("exercise_categories")
      .insert({
        name: input.name,
        description: input.description ?? null,
        parent_id: input.parent_id ?? null,
        position: nextPosition,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Result<ExerciseCategoryRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exercise_categories")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...("parent_id" in input && { parent_id: input.parent_id }),
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

export async function deleteCategory(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("exercise_categories")
      .delete()
      .eq("id", id);

    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderCategories(
  updates: { id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("exercise_categories").upsert(
      updates.map(({ id, position }) => ({ id, position })) as unknown as ExerciseCategoryRow[],
      { onConflict: "id" },
    );

    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
