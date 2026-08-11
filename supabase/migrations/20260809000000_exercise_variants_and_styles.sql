-- ============================================================
-- Hooper: Exercise Variants + Styles
-- ============================================================
-- Three additions that give a program more expressive range without
-- duplicating near-identical exercises in the library:
--
-- 1. Variants: exercises.parent_id groups related exercises (e.g. Lateral
--    Raise, Cable Lateral Raise, Landmine Lateral Raise) as one family.
--    Single-level only (a variant cannot itself have variants) — enforced
--    at the app layer, same as exercise_categories.parent_id is a
--    self-referencing FK with no DB-level depth constraint.
--
-- 2. Styles: exercise_styles is a new flat reference list (no parent_id,
--    unlike exercise_categories) describing how to interpret an exercise's
--    unit types (e.g. "should be dying", "5 possessions then switch").
--    exercises.default_style_id is the exercise's own default; a
--    placement's block_exercises.style_id is copied from that default when
--    the exercise is added to a block, then freely editable per placement —
--    same "copy on add, then diverge" convention exercise_unit_types
--    already has with block_exercise_measurements.
--
-- 3. Per-set variant overrides: block_exercise_set_variants lets a specific
--    set within a placement point at a different variant than the
--    placement's own exercise_id (e.g. set 1 = two-ball low dribbling, set
--    2 = two-ball high dribbling). Sparse — a row only exists for a set
--    whose variant differs from the placement default, so "apply to all
--    sets" is just deleting every row for that placement.

-- ── exercises.parent_id ──────────────────────────────────────
ALTER TABLE exercises
  ADD COLUMN parent_id uuid REFERENCES exercises(id) ON DELETE SET NULL;

CREATE INDEX idx_exercises_parent ON exercises(parent_id);

-- ── exercise_styles ───────────────────────────────────────────
CREATE TABLE exercise_styles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  position    integer     NOT NULL DEFAULT 0,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_styles_position ON exercise_styles(position);

CREATE TRIGGER set_exercise_styles_updated_at
  BEFORE UPDATE ON exercise_styles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── exercises.default_style_id ───────────────────────────────
ALTER TABLE exercises
  ADD COLUMN default_style_id uuid REFERENCES exercise_styles(id) ON DELETE SET NULL;

-- ── block_exercises.style_id ─────────────────────────────────
ALTER TABLE block_exercises
  ADD COLUMN style_id uuid REFERENCES exercise_styles(id) ON DELETE SET NULL;

-- ── block_exercise_set_variants ──────────────────────────────
CREATE TABLE block_exercise_set_variants (
  block_exercise_id uuid    NOT NULL REFERENCES block_exercises(id) ON DELETE CASCADE,
  set_index         integer NOT NULL CHECK (set_index >= 0),
  exercise_id       uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  PRIMARY KEY (block_exercise_id, set_index)
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE exercise_styles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_exercise_set_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_styles_select_all"
  ON exercise_styles FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercise_styles_insert_own"
  ON exercise_styles FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercise_styles_update_own"
  ON exercise_styles FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercise_styles_delete_own"
  ON exercise_styles FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

-- Chains ownership up through block_exercises -> blocks -> sessions ->
-- programs, same pattern as block_exercise_measurements.
CREATE POLICY "block_exercise_set_variants_select_all"
  ON block_exercise_set_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercise_set_variants_insert_own"
  ON block_exercise_set_variants FOR INSERT TO authenticated
  WITH CHECK (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercise_set_variants_delete_own"
  ON block_exercise_set_variants FOR DELETE TO authenticated
  USING (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
