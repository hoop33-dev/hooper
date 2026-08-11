import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  BlockWithExercises,
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseStyleRow,
} from "@hooper/db";
import { toExerciseWithDetails, type RawExercise } from "./exercise.service";

export const BLOCK_EXERCISE_SELECT =
  "*, exercise:exercises(*, exercise_category_links(category_id), exercise_unit_types(unit_type, position)), block_exercise_measurements(*), block_exercise_set_variants(set_index, exercise:exercises(*))";

// Select content for a single `blocks` row, embedding its placed exercises.
const BLOCK_SELECT = `*, block_exercises(${BLOCK_EXERCISE_SELECT})`;

// Select content for a single `sessions` row, embedding its blocks (which in
// turn embed their block_exercises). Used directly by session.service.ts's
// getSessionById, and nested one level deeper by program.service.ts's
// getProgramById (`sessions(${SESSION_SELECT})`).
export const SESSION_SELECT = `*, blocks(${BLOCK_SELECT})`;

export type RawBlockExercise = BlockExerciseRow & {
  exercise: RawExercise;
  block_exercise_measurements: BlockExerciseMeasurementRow[];
  block_exercise_set_variants: { set_index: number; exercise: ExerciseRow }[];
};
export type RawBlock = BlockRow & { block_exercises: RawBlockExercise[] };

/**
 * Sorts blocks/exercises by position and resolves each placed exercise's
 * nested `exercise` embed into the same `ExerciseWithDetails` shape the
 * exercise library uses, so a block-exercise measurement modal can read
 * `exercise.unitTypes` regardless of whether it was loaded via the program
 * canvas or the session split-panel view.
 */
export function shapeBlocksWithExercises(
  rawBlocks: RawBlock[],
  allCategories: ExerciseCategoryRow[],
  allStyles: ExerciseStyleRow[],
): BlockWithExercises[] {
  return [...rawBlocks]
    .sort((a, b) => a.position - b.position)
    .map(({ block_exercises, ...block }) => ({
      ...block,
      exercises: [...block_exercises]
        .sort((a, b) => a.position - b.position)
        .map(
          ({
            exercise,
            block_exercise_measurements,
            block_exercise_set_variants,
            ...blockExercise
          }) => ({
            ...blockExercise,
            exercise: toExerciseWithDetails(exercise, allCategories, allStyles),
            measurements: [...block_exercise_measurements].sort(
              (a, b) => a.position - b.position || a.set_index - b.set_index,
            ),
            setVariants: Object.fromEntries(
              block_exercise_set_variants.map((v) => [v.set_index, v.exercise]),
            ),
          }),
        ),
    }));
}
