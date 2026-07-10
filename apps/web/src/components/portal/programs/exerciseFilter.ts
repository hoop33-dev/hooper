import type { ExerciseWithDetails } from "@hooper/db";

export function filterExercises(
  exercises: ExerciseWithDetails[],
  search: string,
  categoryId: string,
): ExerciseWithDetails[] {
  const q = search.trim().toLowerCase();
  return exercises.filter(
    (ex) =>
      (!q || ex.name.toLowerCase().includes(q)) &&
      (!categoryId || ex.categories.some((c) => c.id === categoryId)),
  );
}
