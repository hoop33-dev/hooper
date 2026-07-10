import { getDescendantIds } from "@/src/lib/categoryTree";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";

export function filterExercises(
  exercises: ExerciseWithDetails[],
  search: string,
  categoryId: string,
  categories: ExerciseCategoryRow[] = [],
): ExerciseWithDetails[] {
  const q = search.trim().toLowerCase();
  const categoryIds = categoryId
    ? new Set([categoryId, ...getDescendantIds(categoryId, categories)])
    : null;
  return exercises.filter(
    (ex) =>
      (!q || ex.name.toLowerCase().includes(q)) &&
      (!categoryIds || ex.categories.some((c) => categoryIds.has(c.id))),
  );
}
