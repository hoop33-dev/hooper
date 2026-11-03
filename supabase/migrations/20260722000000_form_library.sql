-- ============================================================
-- Hooper: Form Library
-- ============================================================

-- ── forms ────────────────────────────────────────────────────
CREATE TABLE forms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_created_by ON forms(created_by);

CREATE TRIGGER set_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── form_questions ───────────────────────────────────────────
-- `min_value`/`max_value` are only meaningful for 'number' and 'slider'
-- questions — an app-layer concern, same convention as
-- block_exercises.reps/value (see 20260701000000_program_library.sql).
CREATE TABLE form_questions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     uuid        NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  position    integer     NOT NULL DEFAULT 0,
  prompt      text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('short_text', 'number', 'slider', 'dropdown', 'yes_no')),
  required    boolean     NOT NULL DEFAULT true,
  min_value   numeric,
  max_value   numeric,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_questions_form_pos ON form_questions(form_id, position);

CREATE TRIGGER set_form_questions_updated_at
  BEFORE UPDATE ON form_questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── form_question_options ───────────────────────────────────────
-- Dropdown choices only, up to 5 per question — same shape as
-- exercise_unit_types (no id/timestamps, position-keyed composite PK).
CREATE TABLE form_question_options (
  question_id uuid    NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  position    integer NOT NULL CHECK (position BETWEEN 0 AND 4),
  label       text    NOT NULL,
  PRIMARY KEY (question_id, position)
);

-- ── programs.form_id ─────────────────────────────────────────
-- A program has at most one form; a form may be attached to many programs
-- (shared library, same many-to-one shape as block_exercises → exercises).
ALTER TABLE programs ADD COLUMN form_id uuid REFERENCES forms(id) ON DELETE SET NULL;

CREATE INDEX idx_programs_form_id ON programs(form_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE forms                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_question_options  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_select_all"
  ON forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "forms_insert_own"
  ON forms FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "forms_update_own"
  ON forms FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "forms_delete_own"
  ON forms FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "form_questions_select_all"
  ON form_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "form_questions_insert_own"
  ON form_questions FOR INSERT TO authenticated
  WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "form_questions_update_own"
  ON form_questions FOR UPDATE TO authenticated
  USING (
    form_id IN (SELECT id FROM forms WHERE created_by = get_auth_profile_id())
  )
  WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "form_questions_delete_own"
  ON form_questions FOR DELETE TO authenticated
  USING (
    form_id IN (SELECT id FROM forms WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "form_question_options_select_all"
  ON form_question_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "form_question_options_insert_own"
  ON form_question_options FOR INSERT TO authenticated
  WITH CHECK (
    question_id IN (
      SELECT q.id FROM form_questions q
      JOIN forms f ON f.id = q.form_id
      WHERE f.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "form_question_options_delete_own"
  ON form_question_options FOR DELETE TO authenticated
  USING (
    question_id IN (
      SELECT q.id FROM form_questions q
      JOIN forms f ON f.id = q.form_id
      WHERE f.created_by = get_auth_profile_id()
    )
  );
