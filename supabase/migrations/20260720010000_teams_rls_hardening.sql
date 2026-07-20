-- ============================================================
-- Hooper: Teams / Program Assignments RLS hardening
-- ============================================================
-- Two gaps in 20260720000000_teams_and_program_assignments.sql, caught in
-- PR review:
--
-- 1. teams/team_members/program_assignments INSERT policies only checked
--    created_by/assigned_by = get_auth_profile_id() — true for any
--    authenticated profile's own id, not just coaches. A player or parent
--    profile could create teams, roster members onto them, and create
--    assignments despite the feature (and the lookup RPC) being coach-only.
--
-- 2. program_assignments_update_own only re-checked assigned_by, not team
--    ownership. A coach could create a valid direct assignment (player_id
--    set), then UPDATE it to set team_id to a team they don't own while
--    clearing player_id — the exclusive-arc CHECK still passes, and the
--    ownership guard that exists on INSERT was never re-applied on UPDATE.

-- ── is_coach(): reusable role check, mirrors get_auth_profile_id() ────
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

-- Reuse it in lookup_athlete_by_username instead of its own inline check.
CREATE OR REPLACE FUNCTION lookup_athlete_by_username(p_username text)
RETURNS TABLE (
  id         uuid,
  first_name text,
  last_name  text,
  username   text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url
  FROM profiles p
  JOIN user_roles ur ON ur.profile_id = p.id AND ur.role = 'player'
  WHERE p.username = lower(p_username)
    AND is_coach()
$$;

-- ── Fix 1: require the coach role to create teams/members/assignments ──
DROP POLICY "teams_insert_own" ON teams;
CREATE POLICY "teams_insert_own"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id() AND is_coach());

DROP POLICY "team_members_insert_own" ON team_members;
CREATE POLICY "team_members_insert_own"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (
    is_coach()
    AND team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
  );

DROP POLICY "program_assignments_insert_own" ON program_assignments;
CREATE POLICY "program_assignments_insert_own"
  ON program_assignments FOR INSERT TO authenticated
  WITH CHECK (
    is_coach()
    AND assigned_by = get_auth_profile_id()
    AND (
      team_id IS NULL
      OR team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
    )
  );

-- ── Fix 2: re-check team ownership on UPDATE, not just on INSERT ───────
DROP POLICY "program_assignments_update_own" ON program_assignments;
CREATE POLICY "program_assignments_update_own"
  ON program_assignments FOR UPDATE TO authenticated
  USING (assigned_by = get_auth_profile_id())
  WITH CHECK (
    assigned_by = get_auth_profile_id()
    AND (
      team_id IS NULL
      OR team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
    )
  );
