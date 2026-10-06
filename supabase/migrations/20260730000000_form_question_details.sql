-- ============================================================
-- Hooper: Form Question Details — description, unit, slider labels
-- ============================================================
-- Adds question-level fields introduced after the form library shipped:
--   - `description`: optional helper text shown under the question prompt
--     in the builder, same role as `forms.description`.
--   - `unit`: optional unit label, 'number' questions only — an app-layer
--     concern, same convention as min_value/max_value below. Constrained
--     to a fixed vocabulary since this repo has no request-validation
--     layer (no Zod); the app's <select> is the source of truth for which
--     values are offered, this CHECK just guards direct writes.
--   - `min_label`/`max_label`: optional text labels for the ends of a
--     'slider' question's fixed 1-10 scale (e.g. "Need Recovery" /
--     "Ready to grind"). Only meaningful for 'slider' — 'number' questions
--     keep using numeric min_value/max_value instead — same app-layer
--     convention as min_value/max_value.

ALTER TABLE form_questions
  ADD COLUMN description text,
  ADD COLUMN unit text CHECK (unit IS NULL OR unit IN ('secs', 'mins', 'hrs', 'kg', 'lbs', 'reps', '%')),
  ADD COLUMN min_label text,
  ADD COLUMN max_label text;
