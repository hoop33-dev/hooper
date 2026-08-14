import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseVideoSource,
} from "@hooper/db";
import type {
  ActionResult,
  ExerciseFormData,
} from "../exercises/ExerciseModal";

/** Actions needed to create a brand-new exercise inline from the program/
 * session editor's exercise picker (see CreateExerciseButton). */
export interface CreateExerciseActions {
  profileId: string;
  createExerciseAction: (data: ExerciseFormData) => Promise<ActionResult>;
  updateExerciseAction: (
    id: string,
    data: ExerciseFormData,
  ) => Promise<ActionResult>;
  updateExerciseVideoUrlAction: (
    id: string,
    videoUrl: string,
    videoSource: ExerciseVideoSource,
  ) => Promise<ActionResult>;
  /** Optional — powers the "+ Add category" affordance inside the create
   * exercise modal's category combobox. */
  createCategoryAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseCategoryRow; error?: string }>;
  styles: ExerciseStyleRow[];
  /** Optional — powers the "+ Add style" affordance inside the create
   * exercise modal's default style selector. */
  createStyleAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseStyleRow; error?: string }>;
}
