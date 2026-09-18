-- Sessions are added individually per week and their count can vary week to
-- week, so a single fixed target no longer makes sense. The list/detail
-- views now derive an actual (min-max) sessions-per-week figure from real
-- `sessions` rows instead.
ALTER TABLE programs DROP COLUMN sessions_per_week;
