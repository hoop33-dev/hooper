export * from "./schema";
export type {
  BlockExerciseRow,
  BlockRow,
  ExerciseCategoryLinkRow,
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseUnitTypeRow,
  ProgramRow,
  ProgramSourceRow,
  ProgramStatus,
  SessionRow,
} from "./schema";

export type RoleType = "player" | "coach" | "parent";
export type LinkStatus = "active" | "disconnected";

export type Region = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  has_real_email: boolean;
  date_of_birth: string | null;
  mobile: string | null;
  region_id: string | null;
  bio: string | null;
  is_private: boolean;
  show_age: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  profile_id: string;
  role: RoleType;
  created_at: string;
};

export type ParentPlayerLink = {
  id: string;
  parent_profile_id: string;
  player_profile_id: string;
  status: LinkStatus;
  profile_settings_locked: boolean;
  created_at: string;
  updated_at: string;
};

import type { ExerciseCategoryRow, ExerciseRow } from "./schema";

export type ExerciseCategoryWithCount = ExerciseCategoryRow & {
  exercise_count: number;
};

export type ExerciseCategoryTreeNode = ExerciseCategoryWithCount & {
  children: ExerciseCategoryTreeNode[];
};

export type ExerciseWithDetails = ExerciseRow & {
  categories: ExerciseCategoryRow[];
  unitTypes: string[];
};

import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  ProgramRow,
  SessionRow,
} from "./schema";

export type { BlockExerciseMeasurementRow, EnteredBy } from "./schema";

// `exercise` carries its own unitTypes (not just the raw row) so the
// measurement modal can offer only that exercise's configured unit types.
// `measurements` (sorted by position) is the placement's own active
// measurements — one per unit type the coach has enabled for this exercise.
export type BlockExerciseWithDetails = BlockExerciseRow & {
  exercise: ExerciseWithDetails;
  measurements: BlockExerciseMeasurementRow[];
};

export type BlockWithExercises = BlockRow & {
  exercises: BlockExerciseWithDetails[];
};

export type SessionWithBlocks = SessionRow & {
  blocks: BlockWithExercises[];
};

import type { SessionTemplateRow } from "./schema";

export type {
  BlockTemplateExerciseMeasurementRow,
  BlockTemplateExerciseRow,
  BlockTemplateRow,
  SessionTemplateRow,
} from "./schema";

// A saved, reusable template — one block is "a saved block", several is "a
// saved session" (see templateShaping.ts). Its blocks are shaped directly
// into the existing BlockWithExercises type (not a parallel type) so every
// block/session-view component works against it unmodified.
export type SessionTemplateWithBlocks = SessionTemplateRow & {
  blocks: BlockWithExercises[];
};

// Lightweight list-view shape: block count + ids + exercise counts, no
// exercise depth. Used by the Block Library list page, the Block Library
// drag panel, and the "Add session > From template" picker.
export type SessionTemplateSummary = SessionTemplateRow & {
  blocks: { id: string; name: string; exerciseCount: number }[];
};

// Full depth: the program canvas renders real blocks + placed exercises
// inline, not a count summary, so this needs the whole tree.
// updatedByName is the creator's display name — only `created_by` can ever
// write to a program (see programs_update_own RLS), so "last edited by"
// and "created by" are always the same person.
export type ProgramWithSessions = ProgramRow & {
  sessions: SessionWithBlocks[];
  updatedByName: string | null;
};

// sessionCount is a real COUNT(*) over `sessions`, and sessionsPerWeek is the
// [min, max] session count across the weeks that have at least one session —
// both derived from real rows since sessions are created manually, not from
// a fixed per-week target. null when no sessions exist yet.
export type ProgramSummary = ProgramRow & {
  sessionCount: number;
  sessionsPerWeek: [min: number, max: number] | null;
};
