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

export type ExerciseRow = {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExerciseCategoryLinkRow = {
  exercise_id: string;
  category_id: string;
};

export type ExerciseUnitTypeRow = {
  exercise_id: string;
  unit_type: string;
  position: number;
};

export type ProgramStatus = "draft" | "active";

export type ProgramRow = {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  sessions_per_week: number;
  status: ProgramStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  program_id: string;
  week_number: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type BlockRow = {
  id: string;
  session_id: string;
  name: string;
  color: string;
  position: number;
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
  created_at: string;
  updated_at: string;
};

export type EnteredBy = "coach" | "athlete";

export type BlockExerciseMeasurementRow = {
  block_exercise_id: string;
  position: number;
  unit_type: string;
  value: number | null;
  value_entered_by: EnteredBy;
  value_unit: string | null;
  created_at: string;
  updated_at: string;
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
      programs: {
        Row: ProgramRow;
        Insert: Partial<ProgramRow> &
          Pick<
            ProgramRow,
            "name" | "weeks" | "sessions_per_week" | "created_by"
          >;
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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRoleEnum;
      program_status: ProgramStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
