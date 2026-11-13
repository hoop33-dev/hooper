-- ============================================================
-- Hooper: Allow programs to start with zero weeks
-- ============================================================
-- Programs now start empty — the coach adds the first week (and every
-- week after it) via the "+ Week" button/modal, rather than the create
-- form setting an initial duration.

ALTER TABLE programs DROP CONSTRAINT programs_weeks_check;
ALTER TABLE programs ADD CONSTRAINT programs_weeks_check CHECK (weeks >= 0);
