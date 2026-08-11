import type { ExerciseRow, ExerciseWithDetails } from "@hooper/db";

/** The placement's base exercise + all its siblings (whichever one
 * `exercise` currently is) — always at least a single-entry list containing
 * `exercise` itself, even when it has no variants. Used by the measurement
 * modal's variant selectors. */
export function variantOptionsFor(
  exercise: ExerciseWithDetails,
  allExercises: ExerciseWithDetails[],
): ExerciseRow[] {
  const base = exercise.parent_id
    ? allExercises.find((e) => e.id === exercise.parent_id)
    : exercise;
  if (!base) return [exercise];
  return [base, ...base.variants];
}
