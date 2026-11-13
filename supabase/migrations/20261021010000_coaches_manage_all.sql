-- ============================================================
-- Hooper: every coach can manage every team, program and package
-- ============================================================
-- Coaches are staff, not independent owners. Until now, writes were
-- limited to whoever created the parent row: the team's creator, the
-- program's creator (down through sessions, blocks and exercises), or a
-- package's creator and listed coaches. This swaps those checks for
-- is_coach(). Org-scoped access will replace it later.
--
-- INSERT policies on the top-level rows (teams, programs, packages) still
-- require created_by = the caller. That only records who made the row;
-- it doesn't limit who can edit it afterwards.
--
-- Out of scope: the exercise library, forms, session/block templates and
-- unit types keep their creator-only rules.

-- ── teams ─────────────────────────────────────────────────────
DROP POLICY "teams_update_own" ON teams;
DROP POLICY "teams_delete_own" ON teams;
CREATE POLICY "teams_update_coaches"
  ON teams FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "teams_delete_coaches"
  ON teams FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "team_members_insert_own" ON team_members;
DROP POLICY "team_members_delete_own" ON team_members;
CREATE POLICY "team_members_insert_coaches"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "team_members_delete_coaches"
  ON team_members FOR DELETE TO authenticated
  USING (is_coach());

-- Team avatars live under avatars/<team_id>/. The folder still has to be
-- a real team.
DROP POLICY "avatars_insert_teams" ON storage.objects;
DROP POLICY "avatars_update_teams" ON storage.objects;
DROP POLICY "avatars_delete_teams" ON storage.objects;
CREATE POLICY "avatars_insert_teams"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND is_coach()
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );
CREATE POLICY "avatars_update_teams"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND is_coach()
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );
CREATE POLICY "avatars_delete_teams"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND is_coach()
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

-- ── program assignment ────────────────────────────────────────
DROP POLICY "program_teams_insert_own" ON program_teams;
DROP POLICY "program_teams_delete_own" ON program_teams;
CREATE POLICY "program_teams_insert_coaches"
  ON program_teams FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "program_teams_delete_coaches"
  ON program_teams FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "program_athletes_insert_own" ON program_athletes;
DROP POLICY "program_athletes_delete_own" ON program_athletes;
CREATE POLICY "program_athletes_insert_coaches"
  ON program_athletes FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "program_athletes_delete_coaches"
  ON program_athletes FOR DELETE TO authenticated
  USING (is_coach());

-- ── programs and their content ────────────────────────────────
DROP POLICY "programs_update_own" ON programs;
DROP POLICY "programs_delete_own" ON programs;
CREATE POLICY "programs_update_coaches"
  ON programs FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "programs_delete_coaches"
  ON programs FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "program_sources_insert_own" ON program_sources;
DROP POLICY "program_sources_delete_own" ON program_sources;
CREATE POLICY "program_sources_insert_coaches"
  ON program_sources FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "program_sources_delete_coaches"
  ON program_sources FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "sessions_insert_own" ON sessions;
DROP POLICY "sessions_update_own" ON sessions;
DROP POLICY "sessions_delete_own" ON sessions;
CREATE POLICY "sessions_insert_coaches"
  ON sessions FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "sessions_update_coaches"
  ON sessions FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "sessions_delete_coaches"
  ON sessions FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "blocks_insert_own" ON blocks;
DROP POLICY "blocks_update_own" ON blocks;
DROP POLICY "blocks_delete_own" ON blocks;
CREATE POLICY "blocks_insert_coaches"
  ON blocks FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "blocks_update_coaches"
  ON blocks FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "blocks_delete_coaches"
  ON blocks FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_exercises_insert_own" ON block_exercises;
DROP POLICY "block_exercises_update_own" ON block_exercises;
DROP POLICY "block_exercises_delete_own" ON block_exercises;
CREATE POLICY "block_exercises_insert_coaches"
  ON block_exercises FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercises_update_coaches"
  ON block_exercises FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_exercises_delete_coaches"
  ON block_exercises FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_exercise_measurements_insert_own" ON block_exercise_measurements;
DROP POLICY "block_exercise_measurements_update_own" ON block_exercise_measurements;
DROP POLICY "block_exercise_measurements_delete_own" ON block_exercise_measurements;
CREATE POLICY "block_exercise_measurements_insert_coaches"
  ON block_exercise_measurements FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercise_measurements_update_coaches"
  ON block_exercise_measurements FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_exercise_measurements_delete_coaches"
  ON block_exercise_measurements FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_exercise_set_styles_insert_own" ON block_exercise_set_styles;
DROP POLICY "block_exercise_set_styles_delete_own" ON block_exercise_set_styles;
CREATE POLICY "block_exercise_set_styles_insert_coaches"
  ON block_exercise_set_styles FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercise_set_styles_delete_coaches"
  ON block_exercise_set_styles FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_exercise_set_variants_insert_own" ON block_exercise_set_variants;
DROP POLICY "block_exercise_set_variants_delete_own" ON block_exercise_set_variants;
CREATE POLICY "block_exercise_set_variants_insert_coaches"
  ON block_exercise_set_variants FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercise_set_variants_delete_coaches"
  ON block_exercise_set_variants FOR DELETE TO authenticated
  USING (is_coach());

-- ── packages ──────────────────────────────────────────────────
-- Every package write policy and soft_delete_package() goes through this
-- helper, so redefining it opens them all. A soft-deleted package stays
-- read-only.
CREATE OR REPLACE FUNCTION can_edit_package(p_package_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_coach() AND EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = p_package_id
      AND p.deleted_at IS NULL
  )
$$;

-- ── programs.updated_by ───────────────────────────────────────
-- The canvas says "Last edited by …". Until now that used created_by,
-- which was accurate because only the creator could edit. Now any coach
-- can edit, so the program records who last touched it. Child-table
-- edits reach here through touch_program()'s UPDATE, so editing a
-- session, block or exercise counts too. Writes with no signed-in
-- profile (service role) leave it unchanged.
ALTER TABLE programs
  ADD COLUMN updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- The backfill must not count as an edit, or set_programs_updated_at
-- stamps every program's updated_at with the migration time.
ALTER TABLE programs DISABLE TRIGGER set_programs_updated_at;
UPDATE programs SET updated_by = created_by;
ALTER TABLE programs ENABLE TRIGGER set_programs_updated_at;

CREATE OR REPLACE FUNCTION set_program_updated_by()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by := COALESCE(
    get_auth_profile_id(),
    CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE OLD.updated_by END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_programs_updated_by
  BEFORE INSERT OR UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION set_program_updated_by();
