"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/src/services/exerciseCategory.service";
import type { ExerciseCategoryRow } from "@hooper/db";

type ActionResult = { ok: boolean; error?: string; data?: ExerciseCategoryRow };

export async function createCategoryAction(data: {
  name: string;
  description?: string;
  parent_id?: string;
  created_by: string;
}): Promise<ActionResult> {
  const result = await createCategory(data);
  if (result.ok) {
    revalidatePath("/exercises/categories");
    revalidatePath("/exercises");
  }
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error };
}

export async function updateCategoryAction(
  id: string,
  data: { name?: string; description?: string; parent_id?: string | null },
): Promise<ActionResult> {
  const result = await updateCategory(id, data);
  if (result.ok) {
    revalidatePath("/exercises/categories");
    revalidatePath("/exercises");
  }
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const result = await deleteCategory(id);
  if (result.ok) {
    revalidatePath("/exercises/categories");
    revalidatePath("/exercises");
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderCategoriesAction(
  updates: { id: string; position: number }[],
): Promise<ActionResult> {
  const result = await reorderCategories(updates);
  if (result.ok) revalidatePath("/exercises/categories");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
