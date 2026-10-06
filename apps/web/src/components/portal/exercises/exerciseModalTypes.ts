import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
  UnitTypeRow,
} from "@hooper/db";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export type ExerciseFormData = {
  name: string;
  description: string;
  categoryIds: string[];
  unitTypeIds: string[];
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  /** The base exercise this is a variant of — null/omitted for a base
   * exercise. */
  parentId?: string | null;
  defaultStyleId?: string | null;
};

export interface ExerciseModalProps {
  mode: "create" | "edit";
  exercise?: ExerciseWithDetails;
  categories: ExerciseCategoryRow[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  /** Every base exercise (parent_id null), excluding this one in edit mode —
   * the options for the "variant of" selector. */
  baseExercises: ExerciseWithDetails[];
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
    thumbnailUrl?: string | null,
  ) => Promise<ActionResult>;
  /** Powers the category combobox's inline "+ Add category" affordance.
   * Optional so callers that haven't wired it yet just don't get the
   * inline-create UI. */
  createCategoryAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseCategoryRow; error?: string }>;
  /** Powers the style selector's inline "+ Add style" affordance. */
  createStyleAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseStyleRow; error?: string }>;
  /** Powers the unit type selector's inline "+ Add unit type" affordance. */
  createUnitTypeAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: UnitTypeRow; error?: string }>;
  /** When set, the "variant of" selector is pre-filled and locked to this
   * base exercise — used by the "+ Add variant" affordance so the coach
   * can't accidentally change which exercise they're adding a variant to. */
  lockedParentId?: string;
}
