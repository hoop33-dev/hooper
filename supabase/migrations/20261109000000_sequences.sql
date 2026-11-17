-- ============================================================
-- Hooper: Sequences
-- ============================================================
-- A sequence is one trackable item made of ordered steps (e.g. dribble
-- move -> pass -> cut -> finish). Each step is filled with a library
-- exercise, and that exercise can change from set to set. Units are
-- tracked for the whole sequence: 1 rep = one full run of every step.
--
-- 1. Library: sequences -> sequence_steps -> sequence_step_picks, plus
--    sequence_measurements for the per-set targets. Creator-only writes,
--    same as the exercise and block libraries.
--
-- 2. Placement: a placed sequence IS a block_exercises row with a null
--    exercise_id and a non-null sequence_name. That keeps ordering, drag
--    and drop, supersets (blocks.sets cascades into block_exercises.sets),
--    week linking, block_exercise_measurements targets and
--    athlete_measurement_logs working unchanged. Placing copies the
--    library sequence ("copy on add, then diverge", same as unit types);
--    source_sequence_id only records where it came from.
--
-- 3. Templates: block_template_exercises gets the same shape so a saved
--    block keeps its sequences.
--
-- Picks are sparse: set 0 defines each step, and a later set carries the
-- most recent earlier pick forward until it has its own row. Same idea as
-- block_exercise_set_variants. Pick tables have no UPDATE policy; the
-- app replaces them with delete + insert.

-- ── Library ───────────────────────────────────────────────────
CREATE TABLE sequences (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  sets        integer     NOT NULL DEFAULT 1 CHECK (sets > 0),
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequences_created_by ON sequences(created_by);

CREATE TRIGGER set_sequences_updated_at
  BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sequence_steps (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid    NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  label       text    NOT NULL DEFAULT '',
  category_id uuid    REFERENCES exercise_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_sequence_steps_sequence_pos ON sequence_steps(sequence_id, position);

CREATE TABLE sequence_step_picks (
  step_id     uuid    NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  set_index   integer NOT NULL CHECK (set_index >= 0),
  exercise_id uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, set_index)
);

CREATE INDEX idx_sequence_step_picks_exercise ON sequence_step_picks(exercise_id);

CREATE TABLE sequence_measurements (
  sequence_id      uuid    NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  position         integer NOT NULL CHECK (position BETWEEN 0 AND 2),
  set_index        integer NOT NULL DEFAULT 0 CHECK (set_index >= 0),
  unit_type        text    NOT NULL,
  value            numeric CHECK (value IS NULL OR value >= 0),
  value_entered_by text    NOT NULL DEFAULT 'coach' CHECK (value_entered_by IN ('coach', 'athlete')),
  value_unit       text,
  PRIMARY KEY (sequence_id, position, set_index)
);

-- ── Placement ─────────────────────────────────────────────────
ALTER TABLE block_exercises
  ALTER COLUMN exercise_id DROP NOT NULL,
  ADD COLUMN sequence_name        text,
  ADD COLUMN sequence_description text,
  ADD COLUMN source_sequence_id   uuid REFERENCES sequences(id) ON DELETE SET NULL,
  ADD CONSTRAINT block_exercises_exercise_or_sequence
    CHECK ((exercise_id IS NULL) <> (sequence_name IS NULL));

CREATE TABLE block_exercise_sequence_steps (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  block_exercise_id uuid    NOT NULL REFERENCES block_exercises(id) ON DELETE CASCADE,
  position          integer NOT NULL DEFAULT 0,
  label             text    NOT NULL DEFAULT '',
  category_id       uuid    REFERENCES exercise_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_be_sequence_steps_be_pos
  ON block_exercise_sequence_steps(block_exercise_id, position);

CREATE TABLE block_exercise_sequence_picks (
  step_id     uuid    NOT NULL REFERENCES block_exercise_sequence_steps(id) ON DELETE CASCADE,
  set_index   integer NOT NULL CHECK (set_index >= 0),
  exercise_id uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, set_index)
);

CREATE INDEX idx_be_sequence_picks_exercise ON block_exercise_sequence_picks(exercise_id);

-- ── Templates ─────────────────────────────────────────────────
ALTER TABLE block_template_exercises
  ALTER COLUMN exercise_id DROP NOT NULL,
  ADD COLUMN sequence_name        text,
  ADD COLUMN sequence_description text,
  ADD COLUMN source_sequence_id   uuid REFERENCES sequences(id) ON DELETE SET NULL,
  ADD CONSTRAINT block_template_exercises_exercise_or_sequence
    CHECK ((exercise_id IS NULL) <> (sequence_name IS NULL));

CREATE TABLE block_template_exercise_sequence_steps (
  id                         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  block_template_exercise_id uuid    NOT NULL REFERENCES block_template_exercises(id) ON DELETE CASCADE,
  position                   integer NOT NULL DEFAULT 0,
  label                      text    NOT NULL DEFAULT '',
  category_id                uuid    REFERENCES exercise_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_bte_sequence_steps_bte_pos
  ON block_template_exercise_sequence_steps(block_template_exercise_id, position);

CREATE TABLE block_template_exercise_sequence_picks (
  step_id     uuid    NOT NULL REFERENCES block_template_exercise_sequence_steps(id) ON DELETE CASCADE,
  set_index   integer NOT NULL CHECK (set_index >= 0),
  exercise_id uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, set_index)
);

-- ── Logs ──────────────────────────────────────────────────────
-- A sequence set is logged against its block_exercises row like any
-- other placement, but it has no single exercise to record.
ALTER TABLE athlete_measurement_logs
  ALTER COLUMN exercise_id DROP NOT NULL;

-- ── programs.updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_program_from_sequence_step()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM touch_program(s.program_id)
    FROM block_exercises be
    JOIN blocks b ON b.id = be.block_id
    JOIN sessions s ON s.id = b.session_id
    WHERE be.id = COALESCE(NEW.block_exercise_id, OLD.block_exercise_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER touch_program_on_sequence_step_change
  AFTER INSERT OR UPDATE OR DELETE ON block_exercise_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_sequence_step();

CREATE OR REPLACE FUNCTION touch_program_from_sequence_pick()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM touch_program(s.program_id)
    FROM block_exercise_sequence_steps st
    JOIN block_exercises be ON be.id = st.block_exercise_id
    JOIN blocks b ON b.id = be.block_id
    JOIN sessions s ON s.id = b.session_id
    WHERE st.id = COALESCE(NEW.step_id, OLD.step_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER touch_program_on_sequence_pick_change
  AFTER INSERT OR UPDATE OR DELETE ON block_exercise_sequence_picks
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_sequence_pick();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE sequences                              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_step_picks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_measurements                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_exercise_sequence_steps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_exercise_sequence_picks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_template_exercise_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_template_exercise_sequence_picks ENABLE ROW LEVEL SECURITY;

-- Library: creator-only, children chain through the sequence.
CREATE POLICY "sequences_select_all"
  ON sequences FOR SELECT TO authenticated USING (true);
CREATE POLICY "sequences_insert_own"
  ON sequences FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "sequences_update_own"
  ON sequences FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "sequences_delete_own"
  ON sequences FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "sequence_steps_select_all"
  ON sequence_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "sequence_steps_insert_own"
  ON sequence_steps FOR INSERT TO authenticated
  WITH CHECK (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "sequence_steps_update_own"
  ON sequence_steps FOR UPDATE TO authenticated
  USING (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  )
  WITH CHECK (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "sequence_steps_delete_own"
  ON sequence_steps FOR DELETE TO authenticated
  USING (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "sequence_step_picks_select_all"
  ON sequence_step_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "sequence_step_picks_insert_own"
  ON sequence_step_picks FOR INSERT TO authenticated
  WITH CHECK (
    step_id IN (
      SELECT st.id FROM sequence_steps st
      JOIN sequences sq ON sq.id = st.sequence_id
      WHERE sq.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "sequence_step_picks_delete_own"
  ON sequence_step_picks FOR DELETE TO authenticated
  USING (
    step_id IN (
      SELECT st.id FROM sequence_steps st
      JOIN sequences sq ON sq.id = st.sequence_id
      WHERE sq.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "sequence_measurements_select_all"
  ON sequence_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "sequence_measurements_insert_own"
  ON sequence_measurements FOR INSERT TO authenticated
  WITH CHECK (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "sequence_measurements_delete_own"
  ON sequence_measurements FOR DELETE TO authenticated
  USING (
    sequence_id IN (SELECT id FROM sequences WHERE created_by = get_auth_profile_id())
  );

-- Placement: any coach, same as the rest of program content.
CREATE POLICY "block_exercise_sequence_steps_select_all"
  ON block_exercise_sequence_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercise_sequence_steps_insert_coaches"
  ON block_exercise_sequence_steps FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercise_sequence_steps_update_coaches"
  ON block_exercise_sequence_steps FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_exercise_sequence_steps_delete_coaches"
  ON block_exercise_sequence_steps FOR DELETE TO authenticated
  USING (is_coach());

CREATE POLICY "block_exercise_sequence_picks_select_all"
  ON block_exercise_sequence_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercise_sequence_picks_insert_coaches"
  ON block_exercise_sequence_picks FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_exercise_sequence_picks_delete_coaches"
  ON block_exercise_sequence_picks FOR DELETE TO authenticated
  USING (is_coach());

-- Templates: creator-only, chained through the session template.
CREATE POLICY "block_template_exercise_sequence_steps_select_all"
  ON block_template_exercise_sequence_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_template_exercise_sequence_steps_insert_own"
  ON block_template_exercise_sequence_steps FOR INSERT TO authenticated
  WITH CHECK (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercise_sequence_steps_delete_own"
  ON block_template_exercise_sequence_steps FOR DELETE TO authenticated
  USING (
    block_template_exercise_id IN (
      SELECT bte.id FROM block_template_exercises bte
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "block_template_exercise_sequence_picks_select_all"
  ON block_template_exercise_sequence_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_template_exercise_sequence_picks_insert_own"
  ON block_template_exercise_sequence_picks FOR INSERT TO authenticated
  WITH CHECK (
    step_id IN (
      SELECT s.id FROM block_template_exercise_sequence_steps s
      JOIN block_template_exercises bte ON bte.id = s.block_template_exercise_id
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_template_exercise_sequence_picks_delete_own"
  ON block_template_exercise_sequence_picks FOR DELETE TO authenticated
  USING (
    step_id IN (
      SELECT s.id FROM block_template_exercise_sequence_steps s
      JOIN block_template_exercises bte ON bte.id = s.block_template_exercise_id
      JOIN block_templates bt ON bt.id = bte.block_template_id
      JOIN session_templates st ON st.id = bt.session_template_id
      WHERE st.created_by = get_auth_profile_id()
    )
  );
