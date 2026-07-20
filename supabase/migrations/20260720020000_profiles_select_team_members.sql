-- ============================================================
-- Hooper: coaches can read their own roster's profiles
-- ============================================================
-- profiles is otherwise locked to profiles_select_own (+ children, for
-- parents). Once a coach has added an athlete to one of their teams, they
-- have an explicit relationship with that athlete (the same reasoning as
-- profiles_select_children for parent_player_links) and need to read their
-- name/avatar to render the roster. Scoped to team membership only — this
-- does not open profiles to browsing, and does not cover athletes assigned
-- a program individually but never rostered on a team.

CREATE POLICY "profiles_select_team_members"
  ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tm.player_id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.created_by = get_auth_profile_id()
    )
  );
