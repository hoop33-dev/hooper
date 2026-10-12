-- ============================================================
-- Hooper: Block Library
-- ============================================================
-- Reusable templates a coach can save from a real block/session and pull
-- back into any program later. Mirrors sessions -> blocks -> block_exercises
-- -> block_exercise_measurements exactly, minus the linking columns
-- (templates never span weeks, so there's nothing to link). A template with
-- exactly one block is "a saved block"; one with several is "a saved
-- session" — that's a UI distinction based on block count, not a DB flag.

-- ── session_templates ────────────────────────────────────────
CREATE TABLE session_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_templates_created_by ON session_templates(created_by);

CREATE TRIGGER set_session_templates_updated_at
  BEFORE UPDATE ON session_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── block_templates ──────────────────────────────────────────
CREATE TABLE block_templates (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_template_id  uuid        NOT NULL REFERENCES session_templates(id) ON DELETE CASCADE,
  name                 text        NOT NULL,
  color                text        NOT NULL,
  position             integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_block_templates_session_template_pos
  ON block_templates(session_template_id, position);

CREATE TRIGGER set_block_templates_updated_at
  BEFORE UPDATE ON block_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── block_template_exercises ─────────────────────────────────
CREATE TABLE block_template_exercises (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_template_id  uuid        NOT NULL REFERENCES block_templates(id) ON DELETE CASCADE,
  exercise_id        uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position           integer     NOT NULL DEFAULT 0,
  sets               integer     NOT NULL DEFAULT 1 CHECK (sets > 0),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_block_template_exercises_block_pos
  ON block_template_exercises(block_template_id, position);
CREATE INDEX idx_block_template_exercises_exercise
  ON block_template_exercises(exercise_id);

CREATE TRIGGER set_block_template_exercises_updated_at
  BEFORE UPDATE ON block_template_exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── block_template_exercise_measurements ─────────────────────
CREATE TABLE block_template_exercise_measurements (
  block_template_exercise_id  uuid        NOT NULL REFERENCES block_template_exercises(id) ON DELETE CASCADE,
  position                    integer     NOT NULL CHECK (position BETWEEN 0 AND 2),
  unit_type                   text        NOT NULL,
  value                       numeric     CHECK (value IS NULL OR value >= 0),
  value_entered_by            text        NOT NULL DEFAULT 'coach' CHECK (value_entered_by IN ('coach', 'athlete')),
  value_unit                  text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (block_template_exercise_id, position)
);

CREATE TRIGGER set_block_template_exercise_measurements_updated_at
  BEFORE UPDATE ON block_template_exercise_measurements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
-- session_templates carries created_by directly (like programs); child
-- tables chain ownership back up via subqueries, the same pattern as
-- blocks/block_exercises chaining through programs.created_by.
ALTER TABLE session_templates                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_templates                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_template_exercises              ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_template_exercise_measurements  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_templates_select_all"
  ON session_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_templates_insert_own"
  ON session_templates FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "session_templates_update_own"
  ON session_templates FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "session_templates_delete_own"
  ON session_templates FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "block_templates_select_all"
  ON block_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_templates_insert_own"
  ON block_templates FOR INSERT TO authenticated
  WITH CHECK (
    session_template_id IN (
      SELECT id FROM session_templates WHERE created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_templates_update_own"
  ON block_templates FOR UPDATE TO authenticated
  USING (
    session_template_id IN (
      SELECT id FROM session_templates WHERE created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    session_template_id IN (
      SELECT id FROM session_templates WHERE created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_templates_delete_own"
  ON block_templates FOR DELETE TO authenticated
  USING (
    session_template_id IN (
      SELECT id FROM session_templates WHERE created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "block_template_exercises_select_all"
  ON block_template_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_template_exercises_insert_own"
  ON block_template_exercises FOR INSERT TO authenticated
  WITH CHECK (
    block_template_id IN (
      SELECT bt.id FROM block_templates bt
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercises_update_own"
  ON block_template_exercises FOR UPDATE TO authenticated
  USING (
    block_template_id IN (
      SELECT bt.id FROM block_templates bt
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    block_template_id IN (
      SELECT bt.id FROM block_templates bt
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercises_delete_own"
  ON block_template_exercises FOR DELETE TO authenticated
  USING (
    block_template_id IN (
      SELECT bt.id FROM block_templates bt
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "block_template_exercise_measurements_select_all"
  ON block_template_exercise_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_template_exercise_measurements_insert_own"
  ON block_template_exercise_measurements FOR INSERT TO authenticated
  WITH CHECK (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercise_measurements_update_own"
  ON block_template_exercise_measurements FOR UPDATE TO authenticated
  USING (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercise_measurements_delete_own"
  ON block_template_exercise_measurements FOR DELETE TO authenticated
  USING (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
