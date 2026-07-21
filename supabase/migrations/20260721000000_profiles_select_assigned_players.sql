-- ============================================================
-- Hooper: coaches can read profiles of individually-assigned athletes
-- ============================================================
-- profiles_select_team_members (20260720020000) only covers athletes on one
-- of the coach's teams. A coach can also assign a program to a player
-- directly, with no team involved — that's an equally explicit relationship
-- (the coach looked the athlete up and assigned them something), so it
-- should carry the same read access to render an "individuals" roster view.
-- Still scoped, not a browsing policy: only players the coach has actually
-- assigned something to.

CREATE POLICY "profiles_select_assigned_players"
  ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT pa.player_id
      FROM program_assignments pa
      WHERE pa.assigned_by = get_auth_profile_id()
        AND pa.player_id IS NOT NULL
    )
  );
