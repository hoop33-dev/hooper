-- ============================================================
-- Guardian controls: lock a child's profile settings
-- ============================================================
--
-- Parents can stop a managed child from editing their own profile.
-- The flag lives on the parent–player link so it travels with the
-- relationship and is naturally scoped per child.

ALTER TABLE parent_player_links
  ADD COLUMN profile_settings_locked boolean NOT NULL DEFAULT false;

-- ── RLS: a player can read their own link ─────────────────────
-- The child needs to know whether their guardian has locked editing.
-- Uses get_auth_profile_id() (SECURITY DEFINER) so it never triggers
-- the profiles policies — no recursion. See 20260501 fix.
CREATE POLICY "parent_player_links_select_player"
  ON parent_player_links FOR SELECT TO authenticated
  USING (player_profile_id = get_auth_profile_id());

-- ── RLS: a parent can update their own children's links ───────
-- Lets the parent toggle the lock (and any future link settings).
CREATE POLICY "parent_player_links_update_parent"
  ON parent_player_links FOR UPDATE TO authenticated
  USING (parent_profile_id = get_auth_profile_id())
  WITH CHECK (parent_profile_id = get_auth_profile_id());

-- ── Defense in depth: a locked child cannot update their profile ──
-- The greyed-out UI is the primary guard; this enforces it server-side
-- so a locked child can't bypass the client. SECURITY DEFINER avoids any
-- RLS recursion when the policy reads parent_player_links.
CREATE OR REPLACE FUNCTION profile_settings_locked_for(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT profile_settings_locked
    FROM parent_player_links
    WHERE player_profile_id = p_profile_id
      AND status = 'active'
    LIMIT 1
  ), false);
$$;

DROP POLICY "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id AND NOT profile_settings_locked_for(id))
  WITH CHECK (auth.uid() = auth_user_id AND NOT profile_settings_locked_for(id));
