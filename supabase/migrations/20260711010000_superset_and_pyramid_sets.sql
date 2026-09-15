-- ============================================================
-- Hooper: Supersets + Per-Set (Pyramid) Measurements
-- ============================================================
-- Two independent additions to the block system:
--
-- 1. Supersets: a block can now act as a shared-round container.
--    `blocks.is_superset` flags it, `blocks.sets` is the round count that
--    then applies to every exercise placed in it (block_exercises.sets is
--    kept in sync by the app layer, not a DB constraint, so every existing
--    read path — the "SETS" stat column, formatMeasurementSummary, etc. —
--    keeps working unmodified against block_exercises.sets).
--
-- 2. Per-set values: block_exercise_measurements gains `set_index`, so a
--    unit-type slot (Reps, Weight, ...) can hold a distinct value per set
--    instead of one value applied uniformly across all of them — this is
--    what a pyramid/wave set (e.g. 12@40kg, 10@50kg, 8@60kg) needs. The
--    primary key widens accordingly; a placement's full row count for one
--    unit-type slot is now `sets` rows (position, 0..sets-1).

ALTER TABLE blocks
  ADD COLUMN is_superset boolean NOT NULL DEFAULT false,
  ADD COLUMN sets         integer CHECK (sets IS NULL OR sets > 0);

ALTER TABLE block_templates
  ADD COLUMN is_superset boolean NOT NULL DEFAULT false,
  ADD COLUMN sets         integer CHECK (sets IS NULL OR sets > 0);

ALTER TABLE block_exercise_measurements
  ADD COLUMN set_index integer NOT NULL DEFAULT 0 CHECK (set_index >= 0);

ALTER TABLE block_exercise_measurements
  DROP CONSTRAINT block_exercise_measurements_pkey,
  ADD PRIMARY KEY (block_exercise_id, position, set_index);

ALTER TABLE block_template_exercise_measurements
  ADD COLUMN set_index integer NOT NULL DEFAULT 0 CHECK (set_index >= 0);

ALTER TABLE block_template_exercise_measurements
  DROP CONSTRAINT block_template_exercise_measurements_pkey,
  ADD PRIMARY KEY (block_template_exercise_id, position, set_index);
