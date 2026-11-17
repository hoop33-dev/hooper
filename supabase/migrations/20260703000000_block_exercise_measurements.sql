-- ============================================================
-- Hooper: Block Exercise Measurements
-- ============================================================
-- Replaces block_exercises.unit_type/reps/value (a single measurement per
-- placement) with a child table holding up to 3 rows per placement. Unit
-- types are fully independent/atomic (Reps, Weight, Time, RPE, Distance,
-- Shots, Makes, etc.) — an exercise like "Sprint" configured with both
-- Distance and Time carries one row each, simultaneously, instead of picking
-- just one. Each row also tracks who fills in its value: the coach (a
-- planned number) or the athlete (left blank here, to be logged later in
-- the mobile app).

ALTER TABLE block_exercises
  DROP COLUMN unit_type,
  DROP COLUMN reps,
  DROP COLUMN value;

CREATE TABLE block_exercise_measurements (
  block_exercise_id uuid        NOT NULL REFERENCES block_exercises(id) ON DELETE CASCADE,
  position          integer     NOT NULL CHECK (position BETWEEN 0 AND 2),
  unit_type         text        NOT NULL,
  value             numeric     CHECK (value IS NULL OR value >= 0),
  value_entered_by  text        NOT NULL DEFAULT 'coach' CHECK (value_entered_by IN ('coach', 'athlete')),
  -- The display unit (e.g. "kg"/"lbs"/"g", "m"/"km", "sec"/"min"/"hr") for
  -- unit types that offer more than one — null for those that don't
  -- (Reps, RPE, Shots, Makes, % 1RM).
  value_unit        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (block_exercise_id, position)
);

CREATE TRIGGER set_block_exercise_measurements_updated_at
  BEFORE UPDATE ON block_exercise_measurements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
-- Chains ownership up through block_exercises -> blocks -> sessions ->
-- programs, one join deeper than block_exercises' own policies.
ALTER TABLE block_exercise_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_exercise_measurements_select_all"
  ON block_exercise_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercise_measurements_insert_own"
  ON block_exercise_measurements FOR INSERT TO authenticated
  WITH CHECK (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercise_measurements_update_own"
  ON block_exercise_measurements FOR UPDATE TO authenticated
  USING (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercise_measurements_delete_own"
  ON block_exercise_measurements FOR DELETE TO authenticated
  USING (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
