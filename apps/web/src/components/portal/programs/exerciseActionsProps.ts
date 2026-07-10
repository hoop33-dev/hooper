import type { ExerciseVideoSource } from "@hooper/db";
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
}
