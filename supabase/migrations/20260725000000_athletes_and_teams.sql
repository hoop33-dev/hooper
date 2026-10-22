-- ============================================================
-- Hooper: Athletes & Teams
-- ============================================================
-- Introduces teams and many-to-many program assignment (to athletes
-- directly, and to teams). Also opens profile visibility to coaches
-- (previously self + own linked children only) so the portal's
-- Athletes section can list every athlete, matching how programs are
-- already visible to every coach. No roster/invite concept yet — any
-- coach can see, team-up, and assign programs to any athlete; this is
-- expected to narrow once an "organizations" concept exists.

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  avatar_url  text,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_created_by ON teams(created_by);

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── team_members ─────────────────────────────────────────────
CREATE TABLE team_members (
  team_id    uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, profile_id)
);

CREATE INDEX idx_team_members_profile ON team_members(profile_id);

-- ── program_athletes ─────────────────────────────────────────
-- Direct program → athlete assignment (independent of team assignment).
CREATE TABLE program_athletes (
  program_id uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (program_id, profile_id)
);

CREATE INDEX idx_program_athletes_profile ON program_athletes(profile_id);

-- ── program_teams ────────────────────────────────────────────
-- Program → team assignment; every current/future team member is
-- expected to derive access from this at read time (no fan-out into
-- program_athletes rows per member).
CREATE TABLE program_teams (
  program_id uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  team_id    uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (program_id, team_id)
);

CREATE INDEX idx_program_teams_team ON program_teams(team_id);

-- ── Row Level Security ────────────────────────────────────────
-- Same chained-ownership style as programs/sessions/blocks: SELECT is
-- open to any authenticated user, mutation is scoped to whoever owns
-- the parent row (team creator, or assigning program's creator).
ALTER TABLE teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_athletes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_teams     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_all"
  ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert_own"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "teams_update_own"
  ON teams FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "teams_delete_own"
  ON teams FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "team_members_select_all"
  ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_insert_own"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "team_members_delete_own"
  ON team_members FOR DELETE TO authenticated
  USING (
    team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "program_athletes_select_all"
  ON program_athletes FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_athletes_insert_own"
  ON program_athletes FOR INSERT TO authenticated
  WITH CHECK (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "program_athletes_delete_own"
  ON program_athletes FOR DELETE TO authenticated
  USING (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "program_teams_select_all"
  ON program_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_teams_insert_own"
  ON program_teams FOR INSERT TO authenticated
  WITH CHECK (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "program_teams_delete_own"
  ON program_teams FOR DELETE TO authenticated
  USING (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );

-- ── Open profiles / user_roles to coaches ───────────────────────
-- profiles_select_own / profiles_select_children (parent→child) and
-- user_roles_select_own are untouched and remain in force; this is an
-- additive policy so a coach can also read every profile/role, which
-- the Athletes portal section needs to list all athletes. Scoped to
-- the coach role specifically (not USING (true)) so players/parents on
-- the mobile app still can't browse each other's profiles.
--
-- is_coach() is a SECURITY DEFINER helper, same pattern as
-- get_auth_profile_id() (20260501000000_fix_rls_recursion.sql) and for
-- the same reason: a user_roles policy whose USING clause subqueries
-- user_roles directly recurses into itself (Postgres re-applies that
-- table's SELECT policies for every access, including from within
-- another policy's subquery) — "infinite recursion detected in policy
-- for relation user_roles" (42P17). Routing the check through a
-- SECURITY DEFINER function sidesteps RLS for that one lookup, exactly
-- how get_auth_profile_id() avoids the equivalent recursion on profiles.
CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE profile_id = get_auth_profile_id() AND role = 'coach'
  )
$$;

CREATE POLICY "profiles_select_by_coaches"
  ON profiles FOR SELECT TO authenticated
  USING (is_coach());

CREATE POLICY "user_roles_select_by_coaches"
  ON user_roles FOR SELECT TO authenticated
  USING (is_coach());

-- ── last sign-in, exposed via a SECURITY DEFINER function ───────
-- profile_with_verification (20260430000000_login_and_child_accounts.sql)
-- is security_invoker = true specifically so it enforces the caller's own
-- profiles RLS — but that means it also enforces regular object grants for
-- every table it touches, including auth.users, under the caller's role.
-- No migration has ever granted `authenticated` SELECT on auth.users (see
-- the "never query auth.users directly" comment on profiles.auth_user_id
-- in 20260429000000_initial_schema.sql), so querying that view as a normal
-- session — not the service-role key every prior caller used — fails with
-- "permission denied for table users". Rather than widen auth.users
-- access to every authenticated user (which would leak last_sign_in_at
-- for every profile visible under any RLS policy, not just to coaches),
-- last_sign_in_at is exposed through its own SECURITY DEFINER function,
-- gated by is_coach() the same way is_coach() itself gates the profiles/
-- user_roles policies above. profile_with_verification is left untouched.
CREATE OR REPLACE FUNCTION get_athlete_last_sign_ins(p_profile_ids uuid[])
RETURNS TABLE(profile_id uuid, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.auth_user_id
  WHERE p.id = ANY(p_profile_ids) AND is_coach()
$$;

-- ── Storage: team avatars in the existing avatars bucket ────────
-- Mirrors the parent-manages-child-avatar-folder pattern from
-- 20260619000000_parent_avatar_policy.sql, scoped by teams.created_by
-- instead. Folder convention: {team_id}/... . Public SELECT already
-- covers reads (avatars bucket is public).
--
-- teams (unlike parent_player_links, the table the pattern above
-- subqueries) has its own `name` column, so a bare `name` inside
-- `FROM teams` resolves to teams.name (the team's name) instead of
-- the outer storage.objects.name (the upload path) — Postgres always
-- prefers the innermost matching column, so aliasing the subquery's
-- table (`teams t`) does NOT fix this; `name` still finds `t.name`
-- before reaching the outer scope. The outer reference must be
-- qualified explicitly as storage.objects.name.
CREATE POLICY "avatars_insert_teams"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
        AND t.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "avatars_update_teams"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
        AND t.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "avatars_delete_teams"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
        AND t.created_by = get_auth_profile_id()
    )
  );
