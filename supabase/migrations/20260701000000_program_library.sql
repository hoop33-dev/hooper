-- ============================================================
-- Hooper: Program Library
-- ============================================================

-- ── programs ─────────────────────────────────────────────────
CREATE TABLE programs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  description       text,
  weeks             integer     NOT NULL CHECK (weeks > 0),
  sessions_per_week integer     NOT NULL CHECK (sessions_per_week > 0),
  status            text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  created_by        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_created_by ON programs(created_by);

CREATE TRIGGER set_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── sessions ─────────────────────────────────────────────────
CREATE TABLE sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number integer     NOT NULL CHECK (week_number > 0),
  name        text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_program_week_pos
  ON sessions(program_id, week_number, position);

CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── blocks ───────────────────────────────────────────────────
CREATE TABLE blocks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  color       text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocks_session_pos ON blocks(session_id, position);

CREATE TRIGGER set_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── block_exercises ──────────────────────────────────────────
-- `unit_type` records which of the exercise's own exercise_unit_types was
-- chosen for this placement (plain text, app-layer validated — matching
-- exercise_unit_types.unit_type's own convention, no DB enum). `reps` and
-- `value` are independent nullable slots whose meaning depends on unit_type
-- (value = weight/seconds/meters/percentage); which pair is populated is a
-- UI concern, not a DB invariant.
CREATE TABLE block_exercises (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    uuid        NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  exercise_id uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position    integer     NOT NULL DEFAULT 0,
  sets        integer     NOT NULL DEFAULT 1 CHECK (sets > 0),
  unit_type   text        NOT NULL,
  reps        integer     CHECK (reps IS NULL OR reps > 0),
  value       numeric     CHECK (value IS NULL OR value >= 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_block_exercises_block_pos ON block_exercises(block_id, position);
CREATE INDEX idx_block_exercises_exercise ON block_exercises(exercise_id);

CREATE TRIGGER set_block_exercises_updated_at
  BEFORE UPDATE ON block_exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
-- Only `programs` carries created_by; child tables chain ownership back up
-- via subqueries, the same way exercise_category_links chains to exercises.
ALTER TABLE programs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_exercises  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_select_all"
  ON programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "programs_insert_own"
  ON programs FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "programs_update_own"
  ON programs FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "programs_delete_own"
  ON programs FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "sessions_select_all"
  ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_insert_own"
  ON sessions FOR INSERT TO authenticated
  WITH CHECK (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "sessions_update_own"
  ON sessions FOR UPDATE TO authenticated
  USING (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  )
  WITH CHECK (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "sessions_delete_own"
  ON sessions FOR DELETE TO authenticated
  USING (
    program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "blocks_select_all"
  ON blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocks_insert_own"
  ON blocks FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "blocks_update_own"
  ON blocks FOR UPDATE TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "blocks_delete_own"
  ON blocks FOR DELETE TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );

CREATE POLICY "block_exercises_select_all"
  ON block_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercises_insert_own"
  ON block_exercises FOR INSERT TO authenticated
  WITH CHECK (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercises_update_own"
  ON block_exercises FOR UPDATE TO authenticated
  USING (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  )
  WITH CHECK (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercises_delete_own"
  ON block_exercises FOR DELETE TO authenticated
  USING (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
