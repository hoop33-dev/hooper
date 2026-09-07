-- ============================================================
-- Hooper: Unit Types Catalog
-- ============================================================
-- Promotes "unit types" (Reps, Weight, Time, ...) from a hardcoded frontend
-- constant into a real reference table, exactly mirroring exercise_styles —
-- a coach can now add/edit/delete their own unit types from a manage page,
-- the same way they already can with styles.
--
-- exercise_unit_types (the exercise library's per-exercise assignment,
-- capped at 3 via the existing position CHECK) switches from storing the
-- unit type as free text to referencing this new catalog by id, mirroring
-- how exercises.default_style_id references exercise_styles(id).

-- ── unit_types ────────────────────────────────────────────────
CREATE TABLE unit_types (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  position    integer     NOT NULL DEFAULT 0,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unit_types_position ON unit_types(position);

CREATE TRIGGER set_unit_types_updated_at
  BEFORE UPDATE ON unit_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_types_select_all"
  ON unit_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "unit_types_insert_own"
  ON unit_types FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "unit_types_update_own"
  ON unit_types FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "unit_types_delete_own"
  ON unit_types FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

-- ── Seed the 10 legacy built-in values ───────────────────────
-- Attributed to the earliest-created profile so the seed rows have a valid
-- owner (created_by is NOT NULL, mirroring exercise_styles). On a fresh
-- install with zero profiles this safely no-ops and unit_types starts empty
-- — same as exercise_styles/exercise_categories already do.
DO $$
DECLARE
  seed_profile_id uuid;
BEGIN
  SELECT id INTO seed_profile_id FROM profiles ORDER BY created_at LIMIT 1;

  IF seed_profile_id IS NOT NULL THEN
    INSERT INTO unit_types (name, position, created_by) VALUES
      ('Reps',           0, seed_profile_id),
      ('Reps Each Side', 1, seed_profile_id),
      ('Weight',         2, seed_profile_id),
      ('Time',           3, seed_profile_id),
      ('Distance',       4, seed_profile_id),
      ('% 1RM',          5, seed_profile_id),
      ('RPE',            6, seed_profile_id),
      ('RIR',            7, seed_profile_id),
      ('Shots',          8, seed_profile_id),
      ('Makes',          9, seed_profile_id);
  END IF;
END $$;

-- ── exercise_unit_types: unit_type (text) → unit_type_id (FK) ──
ALTER TABLE exercise_unit_types
  ADD COLUMN unit_type_id uuid REFERENCES unit_types(id) ON DELETE CASCADE;

UPDATE exercise_unit_types eut
SET unit_type_id = ut.id
FROM unit_types ut
WHERE ut.name = eut.unit_type;

-- Defense in depth: the old picker only ever wrote one of the 10 hardcoded
-- names, so every row should have matched above. Fail loudly instead of
-- silently dropping an exercise's unit type if that assumption ever breaks.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM exercise_unit_types WHERE unit_type_id IS NULL) THEN
    RAISE EXCEPTION 'exercise_unit_types has rows with no matching unit_types row after backfill';
  END IF;
END $$;

ALTER TABLE exercise_unit_types
  ALTER COLUMN unit_type_id SET NOT NULL;

ALTER TABLE exercise_unit_types
  DROP COLUMN unit_type;
