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
        Insert: Partial<ExerciseCategoryRow> & Pick<ExerciseCategoryRow, "name" | "created_by">;
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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRoleEnum;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
