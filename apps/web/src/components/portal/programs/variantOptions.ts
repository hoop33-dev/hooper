import type { ExerciseRow, ExerciseWithDetails } from "@hooper/db";

/** The placement's base exercise + all its siblings (whichever one
 * `exercise` currently is) — always at least a single-entry list containing
 * `exercise` itself, even when it has no variants. Used by the measurement
 * modal's variant selectors.
 *
 * Always re-resolves the base from `allExercises` (by `exercise.parent_id`
 * when `exercise` is itself a variant, or by `exercise.id` when it's
 * already the base) rather than ever falling back to using `exercise`
 * itself as the base — a block placement's embedded `exercise` (see
 * programShaping.ts) always has `variants: []`, since that embed never
 * runs the withVariants() pass listExercises() does. Using it directly
 * when it happens to already be the base silently hid every real sibling
 * variant. */
export function variantOptionsFor(
  exercise: ExerciseWithDetails,
  allExercises: ExerciseWithDetails[],
): ExerciseRow[] {
  const baseId = exercise.parent_id ?? exercise.id;
  const base = allExercises.find((e) => e.id === baseId);
  if (!base) return [exercise];
  return [base, ...base.variants];
}
