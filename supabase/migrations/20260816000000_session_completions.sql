-- ============================================================
-- Hooper: Session Completions (athlete-facing program completion)
-- ============================================================
-- Records what an athlete actually did against a coach-authored
-- program: a per-attempt session_completions row (status, timing incl.
-- pauses, effort rating), per-set athlete_measurement_logs rows (the
-- atomic "what did they log for this set" unit, deliberately mirroring
-- block_exercise_measurements' (block_exercise_id, position, set_index)
-- grain so planned-vs-actual is a trivial join), and form_responses for
-- the pre-session check-in form already supported by the form library
-- (20260722000000_form_library.sql).
--
-- Nothing here touches programs/sessions/blocks/block_exercises/
-- block_exercise_measurements — this is purely additive. RLS follows
-- the same permissive-SELECT / self-scoped-write shape as every other
-- table (see 20260725000000_athletes_and_teams.sql): coaches can see
-- everything for now, same as programs/profiles, until an
-- "organizations" concept exists to narrow it.

-- ── session_completions ──────────────────────────────────────
-- One row per athlete attempt at a specific sessions row. This is the
-- source of "which session is next" (first session with no completed
-- row) and "is there a session to resume" (an in_progress row).
CREATE TABLE session_completions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            uuid        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  athlete_profile_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status                text        NOT NULL DEFAULT 'in_progress'
                                     CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  -- Local calendar day the session was completed, set by the client —
  -- avoids UTC day-boundary skew that started_at/completed_at alone
  -- would introduce for "which day was this done" reporting.
  session_date          date        NOT NULL DEFAULT CURRENT_DATE,
  -- Pause accounting: paused_at is set while paused and cleared on
  -- resume, at which point the elapsed span is folded into
  -- paused_duration_seconds. Active duration = completed_at - started_at
  -- - paused_duration_seconds.
  paused_at             timestamptz,
  paused_duration_seconds integer   NOT NULL DEFAULT 0 CHECK (paused_duration_seconds >= 0),
  -- Computed once at completion and stored so history/progress reads
  -- don't need to recompute it from started_at/completed_at/pauses.
  active_duration_seconds integer   CHECK (active_duration_seconds IS NULL OR active_duration_seconds >= 0),
  effort_rpe            smallint    CHECK (effort_rpe IS NULL OR effort_rpe BETWEEN 1 AND 10),
  -- FK added below, after form_responses exists (the two tables
  -- reference each other: a response belongs to a completion, a
  -- completion points at its pre-session response).
  pre_form_response_id  uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_completions_session_athlete
  ON session_completions(session_id, athlete_profile_id);
CREATE INDEX idx_session_completions_athlete_date
  ON session_completions(athlete_profile_id, session_date DESC);

-- At most one in-progress attempt per (session, athlete) — relaunching
-- the app after a crash/close resumes this row instead of creating a
-- duplicate.
CREATE UNIQUE INDEX idx_session_completions_one_in_progress
  ON session_completions(session_id, athlete_profile_id)
  WHERE status = 'in_progress';

CREATE TRIGGER set_session_completions_updated_at
  BEFORE UPDATE ON session_completions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── athlete_measurement_logs ─────────────────────────────────
-- The atomic "what did they log for this set" unit. Same grain as
-- block_exercise_measurements (block_exercise_id, position, set_index)
-- so planned vs. actual is a direct join, and partial completion
-- (some sets done, some pending, some skipped) is native — no separate
-- block- or session-level completion table is needed since "is this
-- block done" / "where should a resumed session reopen" are both
-- fully derivable by grouping these rows.
CREATE TABLE athlete_measurement_logs (
  session_completion_id uuid    NOT NULL REFERENCES session_completions(id) ON DELETE CASCADE,
  block_exercise_id     uuid    NOT NULL REFERENCES block_exercises(id) ON DELETE CASCADE,
  position               integer NOT NULL,
  set_index              integer NOT NULL,
  -- Denormalized off the block_exercise/session chain specifically so
  -- "all history for exercise X for athlete Y" (progress tracking, and
  -- the last-value pre-fill) is a single indexed lookup instead of a
  -- multi-table join through block_exercises -> blocks -> sessions.
  athlete_profile_id     uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id            uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  unit_type               text    NOT NULL,
  -- Snapshot of the coach's planned value at logging time, so a later
  -- edit to the plan doesn't rewrite what the athlete actually saw.
  planned_value           numeric,
  actual_value            numeric,
  status                  text    NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'completed', 'skipped')),
  logged_at               timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_completion_id, block_exercise_id, position, set_index)
);

-- Powers both the progress/history view and the last-value pre-fill
-- lookup (WHERE athlete_profile_id = ? AND exercise_id = ? AND
-- unit_type = ? ORDER BY logged_at DESC LIMIT 1).
CREATE INDEX idx_athlete_measurement_logs_history
  ON athlete_measurement_logs(athlete_profile_id, exercise_id, logged_at DESC);

CREATE TRIGGER set_athlete_measurement_logs_updated_at
  BEFORE UPDATE ON athlete_measurement_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── form_responses ───────────────────────────────────────────
-- Submissions against the existing forms/form_questions library
-- (20260722000000_form_library.sql). A single jsonb answers column is
-- enough here — question_id -> value — since answers aren't
-- aggregated/queried across athletes today; a fully-normalized answers
-- table can be added later if that changes. Write-once (submitted with
-- the pre-session check-in), so no updated_at/update policy.
CREATE TABLE form_responses (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id                uuid        NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  athlete_profile_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_completion_id  uuid        REFERENCES session_completions(id) ON DELETE CASCADE,
  answers                jsonb       NOT NULL DEFAULT '{}'::jsonb,
  submitted_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_responses_athlete
  ON form_responses(athlete_profile_id, submitted_at DESC);
CREATE INDEX idx_form_responses_session_completion
  ON form_responses(session_completion_id);

ALTER TABLE session_completions
  ADD CONSTRAINT session_completions_pre_form_response_id_fkey
  FOREIGN KEY (pre_form_response_id) REFERENCES form_responses(id) ON DELETE SET NULL;

-- ── Row Level Security ────────────────────────────────────────
-- Same shape as the rest of the schema: SELECT is open to any
-- authenticated user (coaches see everything, same as programs), write
-- access is scoped to the athlete who owns the row.
ALTER TABLE session_completions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_measurement_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_completions_select_all"
  ON session_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_completions_insert_own"
  ON session_completions FOR INSERT TO authenticated
  WITH CHECK (athlete_profile_id = get_auth_profile_id());
CREATE POLICY "session_completions_update_own"
  ON session_completions FOR UPDATE TO authenticated
  USING (athlete_profile_id = get_auth_profile_id())
  WITH CHECK (athlete_profile_id = get_auth_profile_id());

CREATE POLICY "athlete_measurement_logs_select_all"
  ON athlete_measurement_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "athlete_measurement_logs_insert_own"
  ON athlete_measurement_logs FOR INSERT TO authenticated
  WITH CHECK (athlete_profile_id = get_auth_profile_id());
CREATE POLICY "athlete_measurement_logs_update_own"
  ON athlete_measurement_logs FOR UPDATE TO authenticated
  USING (athlete_profile_id = get_auth_profile_id())
  WITH CHECK (athlete_profile_id = get_auth_profile_id());

CREATE POLICY "form_responses_select_all"
  ON form_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "form_responses_insert_own"
  ON form_responses FOR INSERT TO authenticated
  WITH CHECK (athlete_profile_id = get_auth_profile_id());
