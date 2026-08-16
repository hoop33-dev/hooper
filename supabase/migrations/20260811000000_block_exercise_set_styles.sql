-- ============================================================
-- Hooper: Per-Set Style Overrides
-- ============================================================
-- block_exercise_set_styles lets a specific set within a placement carry a
-- different style than the placement's own style_id — sparse, mirroring
-- block_exercise_set_variants (20260809000000_exercise_variants_and_styles.sql):
-- a row only exists for a set whose style differs from the placement
-- default, so "apply to all sets" is just deleting every row for that
-- placement.
--
-- Unlike block_exercise_set_variants.exercise_id (always NOT NULL — every
-- set always resolves to *some* exercise), style_id here is nullable:
-- "no style" is a real, distinct state a set can override *to* (e.g. the
-- placement default is "Warmup" but one set should explicitly have no
-- style), not just the absence of an override row. A NULL style_id row
-- still means "this set differs from the default" (an explicit override to
-- nothing); the row being absent entirely means "inherits the placement
-- default" instead.
--
-- ON DELETE CASCADE on style_id (not SET NULL, unlike
-- block_exercises.style_id/exercises.default_style_id): an override row's
-- only reason to exist is "this set differs from the default" — if the
-- target style is deleted there's nothing left to differ to, so the row
-- should vanish (falling back to the placement's own style_id) rather than
-- persist pointing at a deleted style.

CREATE TABLE block_exercise_set_styles (
  block_exercise_id uuid    NOT NULL REFERENCES block_exercises(id) ON DELETE CASCADE,
  set_index         integer NOT NULL CHECK (set_index >= 0),
  style_id          uuid    REFERENCES exercise_styles(id) ON DELETE CASCADE,
  PRIMARY KEY (block_exercise_id, set_index)
);

-- ── Row Level Security ────────────────────────────────────────
-- Chains ownership up through block_exercises -> blocks -> sessions ->
-- programs, same pattern as block_exercise_set_variants. No update policy:
-- full delete-then-reinsert is the convention (see replaceSetStyles).
ALTER TABLE block_exercise_set_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_exercise_set_styles_select_all"
  ON block_exercise_set_styles FOR SELECT TO authenticated USING (true);
CREATE POLICY "block_exercise_set_styles_insert_own"
  ON block_exercise_set_styles FOR INSERT TO authenticated
  WITH CHECK (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
CREATE POLICY "block_exercise_set_styles_delete_own"
  ON block_exercise_set_styles FOR DELETE TO authenticated
  USING (
    block_exercise_id IN (
      SELECT be.id FROM block_exercises be
      JOIN blocks b ON b.id = be.block_id
      JOIN sessions s ON s.id = b.session_id
      JOIN programs p ON p.id = s.program_id
      WHERE p.created_by = get_auth_profile_id()
    )
  );
