export * from "./schema";
export type {
  BlockExerciseRow,
  BlockExerciseSetStyleRow,
  BlockExerciseSetVariantRow,
  BlockRow,
  ExerciseCategoryLinkRow,
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseStyleRow,
  ExerciseUnitTypeRow,
  FormQuestionOptionRow,
  FormQuestionRow,
  FormQuestionType,
  FormRow,
  ProfileWithVerificationRow,
  ProgramAthleteRow,
  ProgramRow,
  ProgramSourceRow,
  ProgramStatus,
  ProgramTeamRow,
  RegionRow,
  SessionRow,
  TeamMemberRow,
  TeamRow,
  UnitTypeRow,
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

import type {
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseStyleRow,
} from "./schema";

export type ExerciseCategoryWithCount = ExerciseCategoryRow & {
  exercise_count: number;
};

export type ExerciseCategoryTreeNode = ExerciseCategoryWithCount & {
  children: ExerciseCategoryTreeNode[];
};

// `variants` is populated only on a base exercise (parent_id null) — the
// other exercises whose parent_id points back at this one. A variant's own
// `variants` array is always empty (single-level nesting).
export type ExerciseWithDetails = ExerciseRow & {
  categories: ExerciseCategoryRow[];
  /** Resolved display names, sorted by position — every existing display
   * consumer keeps reading plain strings regardless of the underlying
   * unit_type_id-based storage. */
  unitTypes: string[];
  /** The same selection as unitTypes, as unit_types catalog ids (sorted by
   * position) — used to pre-select the edit modal's UnitTypeSelect. */
  unitTypeIds: string[];
  defaultStyle: ExerciseStyleRow | null;
  variants: ExerciseWithDetails[];
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
// `style_id` (inherited from BlockExerciseRow) is resolved against the
// styles list already loaded alongside the program, not embedded here.
// `setVariants` is sparse, keyed by set_index — only sets whose variant
// differs from `exercise_id` have an entry (a resolved ExerciseRow, not
// just an id, since the modal needs the variant's name to display it).
// `setStyles` is the same sparse convention for style_id — only sets whose
// style differs from the placement's own style_id have an entry. A `null`
// entry means that set explicitly has no style (distinct from no entry at
// all, which means "inherits the placement default").
export type BlockExerciseWithDetails = BlockExerciseRow & {
  exercise: ExerciseWithDetails;
  measurements: BlockExerciseMeasurementRow[];
  setVariants: Record<number, ExerciseRow>;
  setStyles: Record<number, ExerciseStyleRow | null>;
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

import type { FormQuestionOptionRow, FormQuestionRow, FormRow } from "./schema";

export type FormQuestionWithOptions = FormQuestionRow & {
  options: FormQuestionOptionRow[];
};

export type FormWithQuestions = FormRow & {
  questions: FormQuestionWithOptions[];
};

// questionCount and programCount are both real COUNT(*)s (over
// form_questions and programs.form_id respectively), derived from real rows
// the same way ProgramSummary derives sessionCount above.
export type FormSummary = FormRow & {
  questionCount: number;
  programCount: number;
};

import type { ProfileRow, TeamRow } from "./schema";

export type AssignedProgramRef = { id: string; name: string };

// last_sign_in_at comes from the get_athlete_last_sign_ins() SECURITY
// DEFINER RPC (auth.users isn't grant-accessible to a plain authenticated
// session — see the migration comment), gated to coach callers only.
export type AthleteSummary = ProfileRow & {
  last_sign_in_at: string | null;
  programs: AssignedProgramRef[];
};

export type AthleteDetail = ProfileRow & {
  last_sign_in_at: string | null;
  regionName: string | null;
  programs: AssignedProgramRef[];
};

export type TeamSummary = TeamRow & {
  memberCount: number;
  programs: AssignedProgramRef[];
};

// joined_at is the team_members row's created_at — when this profile was
// added to the team, not the profile's own created_at.
export type TeamMember = ProfileRow & { joined_at: string };

export type TeamDetail = TeamRow & {
  programs: AssignedProgramRef[];
  members: TeamMember[];
};
