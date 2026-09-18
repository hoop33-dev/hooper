-- ============================================================
-- Hooper: Block Exercise Measurements — value_unit fixup
-- ============================================================
-- 20260703000000_block_exercise_measurements.sql was edited (value_unit
-- added, then reps/reps_entered_by removed) after an earlier revision of it
-- had already been applied to this branch's database, so its live schema
-- may be missing value_unit and/or still carry reps/reps_entered_by. This
-- brings the table to its final shape regardless of which intermediate
-- revision actually landed, without needing to know the exact current state.

ALTER TABLE block_exercise_measurements
  ADD COLUMN IF NOT EXISTS value_unit text;

ALTER TABLE block_exercise_measurements
  DROP COLUMN IF EXISTS reps,
  DROP COLUMN IF EXISTS reps_entered_by;
