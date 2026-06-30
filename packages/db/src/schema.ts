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

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

interface TableShape<R> {
  Row: Row<R>;
  Insert: Insert<R>;
  Update: Update<R>;
  Relationships: [];
}

export interface ProfileRow {
  id: string;
  auth_user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  profile_id: string;
  role: UserRoleEnum;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      user_roles: TableShape<UserRoleRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: UserRoleEnum;
    };
    CompositeTypes: Record<never, never>;
  };
}
