/**
 * STUB — do not hand-edit the real version.
 *
 * The authoritative Supabase schema types are generated from the shared
 * Supabase project once migrations have been applied:
 *
 *   supabase gen types typescript --project-id <id> > packages/db/src/schema.ts
 *
 * Replace this stub wholesale with the generated output. Both apps consume the
 * `Database` type from here (via `@hooper/db`), so there is a single source of
 * truth for the generated schema.
 */

// The Supabase-generated schema declares enums inline, so this file is kept
// self-contained (no import from ./index) to avoid a circular dependency.
type UserRoleEnum = "player" | "coach" | "parent";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  auth_user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
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

export type UserRoleRow = {
  id: string;
  profile_id: string;
  role: UserRoleEnum;
  created_at: string;
};

export type RegionRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

/** view: profile_with_verification (security_invoker) — profiles joined to
 * auth.users, only readable where the caller's own profiles RLS allows the
 * underlying row. */
export type ProfileWithVerificationRow = ProfileRow & {
  is_verified: boolean;
  auth_email: string | null;
  last_sign_in_at: string | null;
};

export type TeamRow = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  team_id: string;
  profile_id: string;
  created_at: string;
};

export type ProgramAthleteRow = {
  program_id: string;
  profile_id: string;
  created_at: string;
};

export type ProgramTeamRow = {
  program_id: string;
  team_id: string;
  created_at: string;
};

export type ExerciseCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExerciseVideoSource = "upload" | "link";
export type ExerciseVideoOrientation = "landscape" | "portrait";

export type ExerciseRow = {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  /** Whether video_url points at an uploaded file or an external link. Null iff video_url is null. */
  video_source: ExerciseVideoSource | null;
  /** Landscape vs portrait framing for the in-app player, so it can rotate a
   * landscape video to fill its always-portrait frame. Computed once
   * server-side from YouTube's oEmbed thumbnail dimensions when video_source
   * is "link"; always null for "upload" (the player reads orientation live
   * from the decoded video instead) and when there's no video. */
  video_orientation: ExerciseVideoOrientation | null;
  /** Captured client-side at upload time (see
   * apps/web/src/lib/videoThumbnailCapture.ts) — uploads have no
   * ID-derived thumbnail the way YouTube links do. Null for "link" videos
   * (mobile derives their thumbnail from the URL) and when there's no
   * video. */
  video_thumbnail_url: string | null;
  /** The base exercise this is a variant of — null for a base exercise.
   * Single-level only (a variant's own parent_id is never itself set),
   * enforced at the app layer, not the DB. */
  parent_id: string | null;
  /** Default style/descriptor for this exercise (e.g. "should be dying") —
   * copied onto block_exercises.style_id when placed into a program, then
   * freely editable per placement. */
  default_style_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExerciseStyleRow = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExerciseCategoryLinkRow = {
  exercise_id: string;
  category_id: string;
};

export type UnitTypeRow = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExerciseUnitTypeRow = {
  exercise_id: string;
  unit_type_id: string;
  position: number;
};

export type ProgramStatus = "draft" | "active";

export type ProgramRow = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  weeks: number;
  status: ProgramStatus;
  created_by: string;
  /** At most one form per program; the same form may be attached to many
   * programs (see FormRow) — null when no form is attached. */
  form_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  program_id: string;
  week_number: number;
  name: string;
  position: number;
  /** Shared across sessions duplicated together across weeks — null when
   * this session isn't linked to any others. */
  link_group_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BlockRow = {
  id: string;
  session_id: string;
  name: string;
  color: string;
  position: number;
  /** Shared across the corresponding block in each linked sibling session. */
  link_group_id: string | null;
  /** When true, `sets` is the shared round count for every exercise placed
   * in this block (a superset/circuit) — each block_exercises.sets is kept
   * in sync with it by the app layer. */
  is_superset: boolean;
  /** Only meaningful when is_superset is true; null otherwise. */
  sets: number | null;
  created_at: string;
  updated_at: string;
};

export type BlockExerciseRow = {
  id: string;
  block_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  notes: string | null;
  /** Shared across the corresponding placement in each linked sibling block. */
  link_group_id: string | null;
  /** Copied from exercise.default_style_id when placed, then editable per
   * placement — null if the exercise has no default and none was chosen. */
  style_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EnteredBy = "coach" | "athlete";

export type BlockExerciseSetVariantRow = {
  block_exercise_id: string;
  /** Which set (0-indexed) this override applies to. */
  set_index: number;
  /** The variant exercise to use for this set instead of the placement's
   * own exercise_id. A row only exists when the set's variant differs from
   * the placement default — sparse, not one row per set. */
  exercise_id: string;
};

export type BlockExerciseSetStyleRow = {
  block_exercise_id: string;
  /** Which set (0-indexed) this override applies to. */
  set_index: number;
  /** The style to use for this set instead of the placement's own style_id
   * — null means this set explicitly has no style, distinct from the row
   * not existing at all (which means "inherits the placement default"). A
   * row only exists when the set's style differs from the placement
   * default — sparse, not one row per set. */
  style_id: string | null;
};

export type BlockExerciseMeasurementRow = {
  block_exercise_id: string;
  /** Which unit-type slot this is (Reps, Weight, ... — up to 3 per
   * placement), not which set. */
  position: number;
  /** Which set (0-indexed) this value belongs to — a placement with `sets`
   * sets has `sets` rows per unit-type slot, one per set_index, so a
   * pyramid/wave set can hold a distinct value per set. */
  set_index: number;
  unit_type: string;
  value: number | null;
  value_entered_by: EnteredBy;
  value_unit: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramSourceRow = {
  id: string;
  source_program_id: string;
  destination_program_id: string;
  created_at: string;
};

export type SessionTemplateRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BlockTemplateRow = {
  id: string;
  session_template_id: string;
  name: string;
  color: string;
  position: number;
  is_superset: boolean;
  sets: number | null;
  created_at: string;
  updated_at: string;
};

export type BlockTemplateExerciseRow = {
  id: string;
  block_template_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BlockTemplateExerciseMeasurementRow = {
  block_template_exercise_id: string;
  position: number;
  set_index: number;
  unit_type: string;
  value: number | null;
  value_entered_by: EnteredBy;
  value_unit: string | null;
  created_at: string;
  updated_at: string;
};

export type FormRow = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type FormQuestionType =
  | "short_text"
  | "number"
  | "slider"
  | "dropdown"
  | "yes_no";

export type FormQuestionUnit =
  | "secs"
  | "mins"
  | "hrs"
  | "kg"
  | "lbs"
  | "reps"
  | "%";

export type FormQuestionRow = {
  id: string;
  form_id: string;
  position: number;
  prompt: string;
  description: string | null;
  type: FormQuestionType;
  required: boolean;
  /** Only meaningful for 'number' and 'slider' questions — a UI concern,
   * same convention as block_exercises.reps/value. */
  min_value: number | null;
  max_value: number | null;
  /** Only meaningful for 'number' questions. */
  unit: FormQuestionUnit | null;
  /** Only meaningful for 'slider' questions — labels for the fixed 1-10
   * scale's low/high ends (e.g. "Need Recovery" / "Ready to grind"). */
  min_label: string | null;
  max_label: string | null;
  created_at: string;
  updated_at: string;
};

export type FormQuestionOptionRow = {
  question_id: string;
  /** 0-4 — up to 5 options, 'dropdown' questions only. */
  position: number;
  label: string;
};

export type SessionCompletionStatus = "in_progress" | "completed" | "abandoned";

export type SessionCompletionRow = {
  id: string;
  session_id: string;
  athlete_profile_id: string;
  status: SessionCompletionStatus;
  started_at: string;
  completed_at: string | null;
  /** Local calendar day, set by the client — avoids UTC day-boundary skew. */
  session_date: string;
  paused_at: string | null;
  paused_duration_seconds: number;
  /** Computed once at completion; null until then. */
  active_duration_seconds: number | null;
  effort_rpe: number | null;
  pre_form_response_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MeasurementLogStatus = "pending" | "completed" | "skipped";

export type AthleteMeasurementLogRow = {
  session_completion_id: string;
  block_exercise_id: string;
  /** Which unit-type slot, matches block_exercise_measurements.position. */
  position: number;
  set_index: number;
  athlete_profile_id: string;
  exercise_id: string;
  unit_type: string;
  /** Snapshot of the coach's planned value at logging time. */
  planned_value: number | null;
  actual_value: number | null;
  status: MeasurementLogStatus;
  logged_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FormResponseRow = {
  id: string;
  form_id: string;
  athlete_profile_id: string;
  session_completion_id: string | null;
  /** question_id -> answer value. */
  answers: Json;
  submitted_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Partial<UserRoleRow>;
        Update: Partial<UserRoleRow>;
        Relationships: [];
      };
      regions: {
        Row: RegionRow;
        Insert: Partial<RegionRow> & Pick<RegionRow, "name" | "slug">;
        Update: Partial<RegionRow>;
        Relationships: [];
      };
      teams: {
        Row: TeamRow;
        Insert: Partial<TeamRow> & Pick<TeamRow, "name" | "created_by">;
        Update: Partial<TeamRow>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: Partial<TeamMemberRow> &
          Pick<TeamMemberRow, "team_id" | "profile_id">;
        Update: Partial<TeamMemberRow>;
        Relationships: [];
      };
      program_athletes: {
        Row: ProgramAthleteRow;
        Insert: Partial<ProgramAthleteRow> &
          Pick<ProgramAthleteRow, "program_id" | "profile_id">;
        Update: Partial<ProgramAthleteRow>;
        Relationships: [];
      };
      program_teams: {
        Row: ProgramTeamRow;
        Insert: Partial<ProgramTeamRow> &
          Pick<ProgramTeamRow, "program_id" | "team_id">;
        Update: Partial<ProgramTeamRow>;
        Relationships: [];
      };
      exercise_categories: {
        Row: ExerciseCategoryRow;
        Insert: Partial<ExerciseCategoryRow> &
          Pick<ExerciseCategoryRow, "name" | "created_by">;
        Update: Partial<ExerciseCategoryRow>;
        Relationships: [];
      };
      exercises: {
        Row: ExerciseRow;
        Insert: Partial<ExerciseRow> & Pick<ExerciseRow, "name" | "created_by">;
        Update: Partial<ExerciseRow>;
        Relationships: [];
      };
      exercise_category_links: {
        Row: ExerciseCategoryLinkRow;
        Insert: ExerciseCategoryLinkRow;
        Update: Partial<ExerciseCategoryLinkRow>;
        Relationships: [];
      };
      exercise_unit_types: {
        Row: ExerciseUnitTypeRow;
        Insert: ExerciseUnitTypeRow;
        Update: Partial<ExerciseUnitTypeRow>;
        Relationships: [];
      };
      exercise_styles: {
        Row: ExerciseStyleRow;
        Insert: Partial<ExerciseStyleRow> &
          Pick<ExerciseStyleRow, "name" | "created_by">;
        Update: Partial<ExerciseStyleRow>;
        Relationships: [];
      };
      unit_types: {
        Row: UnitTypeRow;
        Insert: Partial<UnitTypeRow> & Pick<UnitTypeRow, "name" | "created_by">;
        Update: Partial<UnitTypeRow>;
        Relationships: [];
      };
      programs: {
        Row: ProgramRow;
        Insert: Partial<ProgramRow> &
          Pick<ProgramRow, "name" | "weeks" | "created_by">;
        Update: Partial<ProgramRow>;
        Relationships: [];
      };
      sessions: {
        Row: SessionRow;
        Insert: Partial<SessionRow> &
          Pick<SessionRow, "program_id" | "week_number" | "name">;
        Update: Partial<SessionRow>;
        Relationships: [];
      };
      blocks: {
        Row: BlockRow;
        Insert: Partial<BlockRow> &
          Pick<BlockRow, "session_id" | "name" | "color">;
        Update: Partial<BlockRow>;
        Relationships: [];
      };
      block_exercises: {
        Row: BlockExerciseRow;
        Insert: Partial<BlockExerciseRow> &
          Pick<BlockExerciseRow, "block_id" | "exercise_id">;
        Update: Partial<BlockExerciseRow>;
        Relationships: [];
      };
      block_exercise_measurements: {
        Row: BlockExerciseMeasurementRow;
        Insert: Partial<BlockExerciseMeasurementRow> &
          Pick<
            BlockExerciseMeasurementRow,
            "block_exercise_id" | "position" | "unit_type"
          >;
        Update: Partial<BlockExerciseMeasurementRow>;
        Relationships: [];
      };
      block_exercise_set_variants: {
        Row: BlockExerciseSetVariantRow;
        Insert: BlockExerciseSetVariantRow;
        Update: Partial<BlockExerciseSetVariantRow>;
        Relationships: [];
      };
      block_exercise_set_styles: {
        Row: BlockExerciseSetStyleRow;
        Insert: BlockExerciseSetStyleRow;
        Update: Partial<BlockExerciseSetStyleRow>;
        Relationships: [];
      };
      program_sources: {
        Row: ProgramSourceRow;
        Insert: Partial<ProgramSourceRow> &
          Pick<
            ProgramSourceRow,
            "source_program_id" | "destination_program_id"
          >;
        Update: Partial<ProgramSourceRow>;
        Relationships: [];
      };
      session_templates: {
        Row: SessionTemplateRow;
        Insert: Partial<SessionTemplateRow> &
          Pick<SessionTemplateRow, "name" | "created_by">;
        Update: Partial<SessionTemplateRow>;
        Relationships: [];
      };
      block_templates: {
        Row: BlockTemplateRow;
        Insert: Partial<BlockTemplateRow> &
          Pick<BlockTemplateRow, "session_template_id" | "name" | "color">;
        Update: Partial<BlockTemplateRow>;
        Relationships: [];
      };
      block_template_exercises: {
        Row: BlockTemplateExerciseRow;
        Insert: Partial<BlockTemplateExerciseRow> &
          Pick<BlockTemplateExerciseRow, "block_template_id" | "exercise_id">;
        Update: Partial<BlockTemplateExerciseRow>;
        Relationships: [];
      };
      block_template_exercise_measurements: {
        Row: BlockTemplateExerciseMeasurementRow;
        Insert: Partial<BlockTemplateExerciseMeasurementRow> &
          Pick<
            BlockTemplateExerciseMeasurementRow,
            "block_template_exercise_id" | "position" | "unit_type"
          >;
        Update: Partial<BlockTemplateExerciseMeasurementRow>;
        Relationships: [];
      };
      forms: {
        Row: FormRow;
        Insert: Partial<FormRow> & Pick<FormRow, "name" | "created_by">;
        Update: Partial<FormRow>;
        Relationships: [];
      };
      form_questions: {
        Row: FormQuestionRow;
        Insert: Partial<FormQuestionRow> &
          Pick<FormQuestionRow, "form_id" | "prompt" | "type">;
        Update: Partial<FormQuestionRow>;
        Relationships: [];
      };
      form_question_options: {
        Row: FormQuestionOptionRow;
        Insert: FormQuestionOptionRow;
        Update: Partial<FormQuestionOptionRow>;
        Relationships: [];
      };
      session_completions: {
        Row: SessionCompletionRow;
        Insert: Partial<SessionCompletionRow> &
          Pick<SessionCompletionRow, "session_id" | "athlete_profile_id">;
        Update: Partial<SessionCompletionRow>;
        Relationships: [];
      };
      athlete_measurement_logs: {
        Row: AthleteMeasurementLogRow;
        Insert: Partial<AthleteMeasurementLogRow> &
          Pick<
            AthleteMeasurementLogRow,
            | "session_completion_id"
            | "block_exercise_id"
            | "position"
            | "set_index"
            | "athlete_profile_id"
            | "exercise_id"
            | "unit_type"
          >;
        Update: Partial<AthleteMeasurementLogRow>;
        Relationships: [];
      };
      form_responses: {
        Row: FormResponseRow;
        Insert: Partial<FormResponseRow> &
          Pick<FormResponseRow, "form_id" | "athlete_profile_id">;
        Update: Partial<FormResponseRow>;
        Relationships: [];
      };
    };
    Views: {
      profile_with_verification: {
        Row: ProfileWithVerificationRow;
        Relationships: [];
      };
    };
    Functions: {
      get_athlete_last_sign_ins: {
        Args: { p_profile_ids: string[] };
        Returns: { profile_id: string; last_sign_in_at: string | null }[];
      };
    };
    Enums: {
      user_role: UserRoleEnum;
      program_status: ProgramStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
