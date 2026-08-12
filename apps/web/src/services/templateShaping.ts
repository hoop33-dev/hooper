import type {
  BlockExerciseMeasurementRow,
  BlockExerciseWithDetails,
  BlockTemplateExerciseMeasurementRow,
  BlockTemplateExerciseRow,
  BlockTemplateRow,
  BlockWithExercises,
  ExerciseCategoryRow,
  ExerciseStyleRow,
  SessionTemplateRow,
  SessionTemplateWithBlocks,
} from "@hooper/db";
import { toExerciseWithDetails, type RawExercise } from "./exercise.service";

export const TEMPLATE_BLOCK_EXERCISE_SELECT =
  "*, exercise:exercises(*, exercise_category_links(category_id), exercise_unit_types(unit_type, position)), block_template_exercise_measurements(*)";

const TEMPLATE_BLOCK_SELECT = `*, block_template_exercises(${TEMPLATE_BLOCK_EXERCISE_SELECT})`;

// Select content for a single `session_templates` row, embedding its blocks
// (which in turn embed their block_template_exercises) — the template
// equivalent of programShaping.ts's SESSION_SELECT.
export const SESSION_TEMPLATE_SELECT = `*, block_templates(${TEMPLATE_BLOCK_SELECT})`;

export type RawTemplateBlockExercise = BlockTemplateExerciseRow & {
  exercise: RawExercise;
  block_template_exercise_measurements: BlockTemplateExerciseMeasurementRow[];
};
export type RawTemplateBlock = BlockTemplateRow & {
  block_template_exercises: RawTemplateBlockExercise[];
};
export type RawSessionTemplate = SessionTemplateRow & {
  block_templates: RawTemplateBlock[];
};

/**
 * Shapes raw block_templates rows into the existing `BlockWithExercises`
 * type rather than a parallel `BlockTemplateWithExercises` type —
 * `session_id`/`block_id` become the synthetic parent ids (block/exercise
 * templates have no such columns; every block/session-view component only
 * ever uses them for local grouping) and `link_group_id` is always null,
 * since templates never link. This is what lets the template editor reuse
 * SessionViewShell and every block/exercise component completely
 * unmodified — see templateShaping usage in sessionTemplate.service.ts.
 */
export function shapeBlockTemplatesWithExercises(
  rawBlocks: RawTemplateBlock[],
  allCategories: ExerciseCategoryRow[],
  allStyles: ExerciseStyleRow[],
): BlockWithExercises[] {
  return [...rawBlocks]
    .sort((a, b) => a.position - b.position)
    .map(({ block_template_exercises, session_template_id, ...block }) => ({
      ...block,
      session_id: session_template_id,
      link_group_id: null,
      exercises: [...block_template_exercises]
        .sort((a, b) => a.position - b.position)
        .map(
          ({
            exercise,
            block_template_exercise_measurements,
            block_template_id,
            ...blockExercise
          }): BlockExerciseWithDetails => ({
            ...blockExercise,
            block_id: block_template_id,
            link_group_id: null,
            // Templates have no style_id/set-variant/set-style columns of
            // their own — a template exercise always shows its plain unit
            // types.
            style_id: null,
            setVariants: {},
            setStyles: {},
            exercise: toExerciseWithDetails(exercise, allCategories, allStyles),
            measurements: [...block_template_exercise_measurements]
              .sort(
                (a, b) => a.position - b.position || a.set_index - b.set_index,
              )
              .map(
                ({
                  block_template_exercise_id,
                  ...m
                }): BlockExerciseMeasurementRow => ({
                  ...m,
                  block_exercise_id: block_template_exercise_id,
                }),
              ),
          }),
        ),
    }));
}

export function shapeSessionTemplate(
  raw: RawSessionTemplate,
  allCategories: ExerciseCategoryRow[],
  allStyles: ExerciseStyleRow[],
): SessionTemplateWithBlocks {
  const { block_templates, ...sessionTemplate } = raw;
  return {
    ...sessionTemplate,
    blocks: shapeBlockTemplatesWithExercises(
      block_templates,
      allCategories,
      allStyles,
    ),
  };
}
