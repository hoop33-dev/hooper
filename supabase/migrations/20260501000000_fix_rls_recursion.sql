-- ============================================================
-- Fix infinite RLS recursion in profiles / parent_player_links
-- ============================================================
--
-- Root cause:
--   profiles_select_children reads parent_player_links
--   parent_player_links_select_parent reads profiles (subquery)
--   That triggers profiles_select_children again → infinite recursion
--
-- Fix: introduce a SECURITY DEFINER helper that reads the caller's profile
-- ID without triggering RLS, then use it in every policy that previously
-- did a subquery on profiles.

CREATE OR REPLACE FUNCTION get_auth_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- Recreate parent_player_links_select_parent without a profiles subquery.
DROP POLICY "parent_player_links_select_parent" ON parent_player_links;
CREATE POLICY "parent_player_links_select_parent"
  ON parent_player_links FOR SELECT TO authenticated
  USING (parent_profile_id = get_auth_profile_id());

-- Recreate profiles_select_children without a nested profiles subquery.
DROP POLICY "profiles_select_children" ON profiles;
CREATE POLICY "profiles_select_children"
  ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT player_profile_id
      FROM parent_player_links
      WHERE status = 'active'
        AND parent_profile_id = get_auth_profile_id()
    )
  );

-- Simplify user_roles_select_own the same way (avoids triggering the
-- profiles policies at all when resolving a user's own role).
DROP POLICY "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT TO authenticated
  USING (profile_id = get_auth_profile_id());
