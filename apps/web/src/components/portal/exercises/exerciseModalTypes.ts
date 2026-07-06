import type { UnitType } from "@/src/constants/unitTypes";
import type {
  ExerciseCategoryRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
} from "@hooper/db";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export type ExerciseFormData = {
  name: string;
  description: string;
  categoryIds: string[];
  unitTypes: UnitType[];
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
};

export interface ExerciseModalProps {
  mode: "create" | "edit";
  exercise?: ExerciseWithDetails;
  categories: ExerciseCategoryRow[];
  profileId: string;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  createAction: (data: ExerciseFormData) => Promise<ActionResult>;
  updateAction: (id: string, data: ExerciseFormData) => Promise<ActionResult>;
  deleteAction?: (id: string) => Promise<ActionResult>;
  updateVideoUrlAction: (
    id: string,
    videoUrl: string,
    videoSource: ExerciseVideoSource,
  ) => Promise<ActionResult>;
}
