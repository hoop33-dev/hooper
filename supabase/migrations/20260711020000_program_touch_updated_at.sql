-- ============================================================
-- Hooper: Cascade child edits into programs.updated_at
-- ============================================================
-- programs.updated_at previously only moved when the programs row itself
-- was updated (name/notes/weeks/status) — editing a session, block, or
-- placed exercise left it untouched, even though that's "editing the
-- program" from a coach's point of view. Each child table gets an AFTER
-- trigger that stamps its ancestor program's updated_at, so the program
-- list and the "Last edited ..." label reflect any edit anywhere in the
-- tree. Only `created_by` can ever write to a program (see programs_update_own
-- etc. in 20260701000000_program_library.sql), so `created_by` doubles as
-- "last edited by" — no separate updated_by column needed.

CREATE OR REPLACE FUNCTION touch_program(target_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE programs SET updated_at = now() WHERE id = target_id;
$$;

CREATE OR REPLACE FUNCTION touch_program_from_session()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM touch_program(COALESCE(NEW.program_id, OLD.program_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER touch_program_on_session_change
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_session();

CREATE OR REPLACE FUNCTION touch_program_from_block()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM touch_program(s.program_id)
    FROM sessions s
    WHERE s.id = COALESCE(NEW.session_id, OLD.session_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER touch_program_on_block_change
  AFTER INSERT OR UPDATE OR DELETE ON blocks
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_block();

CREATE OR REPLACE FUNCTION touch_program_from_block_exercise()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM touch_program(s.program_id)
    FROM blocks b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.id = COALESCE(NEW.block_id, OLD.block_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER touch_program_on_block_exercise_change
  AFTER INSERT OR UPDATE OR DELETE ON block_exercises
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_block_exercise();

CREATE OR REPLACE FUNCTION touch_program_from_measurement()
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

CREATE TRIGGER touch_program_on_measurement_change
  AFTER INSERT OR UPDATE OR DELETE ON block_exercise_measurements
  FOR EACH ROW EXECUTE FUNCTION touch_program_from_measurement();
