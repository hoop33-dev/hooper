-- ============================================================
-- Hooper: Teams and Program Assignments
-- ============================================================
-- Lets a coach group athletes into teams and assign a program (from the
-- existing program library) to either a whole team or a single athlete.

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE teams (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_by uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_created_by ON teams(created_by);

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── team_members ─────────────────────────────────────────────
CREATE TABLE team_members (
  team_id   uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, player_id)
);

CREATE INDEX idx_team_members_player ON team_members(player_id);

-- ── program_assignments ──────────────────────────────────────
-- Assigns a program to exactly one target: a team (every current member
-- gets it, and membership changes propagate live — this is a grant, not a
-- per-athlete snapshot) or a single player, for a direct assignment outside
-- any team. Completion is always tracked per-athlete elsewhere regardless of
-- which target granted access; this table only records the grant.
CREATE TABLE program_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  team_id     uuid        REFERENCES teams(id) ON DELETE CASCADE,
  player_id   uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date  date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(team_id, player_id) = 1)
);

CREATE INDEX idx_program_assignments_program ON program_assignments(program_id);
CREATE INDEX idx_program_assignments_team    ON program_assignments(team_id);
CREATE INDEX idx_program_assignments_player  ON program_assignments(player_id);

CREATE TRIGGER set_program_assignments_updated_at
  BEFORE UPDATE ON program_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RPC: look up an athlete by exact username ───────────────
-- profiles is locked to profiles_select_own (+ children, for parents) — a
-- coach has no other way to find an athlete to add to a team or assign a
-- program to directly. Returns only the public fields needed for that, only
-- to callers holding the 'coach' role, and only on an exact username match
-- (never partial/ILIKE) so a coach can look up someone they already know the
-- handle of but can't enumerate the athlete population through this RPC.
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
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE profile_id = get_auth_profile_id() AND role = 'coach'
    )
$$;

REVOKE ALL ON FUNCTION lookup_athlete_by_username(text) FROM public;
GRANT EXECUTE ON FUNCTION lookup_athlete_by_username(text) TO authenticated;

-- ── Row Level Security ────────────────────────────────────────
-- Same convention as the program library: reads open to all authenticated
-- users, writes scoped to the owning coach.
ALTER TABLE teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "program_assignments_select_all"
  ON program_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_assignments_insert_own"
  ON program_assignments FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = get_auth_profile_id()
    AND (
      team_id IS NULL
      OR team_id IN (SELECT id FROM teams WHERE created_by = get_auth_profile_id())
    )
  );
CREATE POLICY "program_assignments_update_own"
  ON program_assignments FOR UPDATE TO authenticated
  USING (assigned_by = get_auth_profile_id())
  WITH CHECK (assigned_by = get_auth_profile_id());
CREATE POLICY "program_assignments_delete_own"
  ON program_assignments FOR DELETE TO authenticated
  USING (assigned_by = get_auth_profile_id());
