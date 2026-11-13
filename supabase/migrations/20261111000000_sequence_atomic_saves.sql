-- ============================================================
-- Hooper: Atomic sequence saves
-- ============================================================
-- Saving a sequence's steps used to be a delete, then a steps insert,
-- then a picks insert, each a separate request. If a later insert failed
-- (a picked exercise deleted mid-save, a dropped connection), the steps
-- were already gone. A library save also replaced measurements the same
-- way. These functions do each save in one transaction.
--
-- SECURITY INVOKER, so the existing RLS policies still decide who may
-- write. A delete that RLS filters to nothing is followed by an insert
-- that RLS rejects, which rolls the whole save back.
--
-- p_steps: [{ "label": text, "category_id": uuid|null,
--             "picks": [{ "set_index": int, "exercise_id": uuid }, …] }, …]
-- in display order; position comes from the array index. Picks arrive
-- already normalized for the set count.

CREATE OR REPLACE FUNCTION replace_sequence_steps(
  p_owner     text,
  p_parent_id uuid,
  p_steps     jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_steps_table text;
  v_picks_table text;
  v_parent_col  text;
  v_step        jsonb;
  v_ord         bigint;
  v_step_id     uuid;
BEGIN
  CASE p_owner
    WHEN 'library' THEN
      v_steps_table := 'sequence_steps';
      v_picks_table := 'sequence_step_picks';
      v_parent_col  := 'sequence_id';
    WHEN 'placement' THEN
      v_steps_table := 'block_exercise_sequence_steps';
      v_picks_table := 'block_exercise_sequence_picks';
      v_parent_col  := 'block_exercise_id';
    WHEN 'template' THEN
      v_steps_table := 'block_template_exercise_sequence_steps';
      v_picks_table := 'block_template_exercise_sequence_picks';
      v_parent_col  := 'block_template_exercise_id';
    ELSE
      RAISE EXCEPTION 'Unknown sequence owner: %', p_owner;
  END CASE;

  -- Picks cascade with their step.
  EXECUTE format('DELETE FROM %I WHERE %I = $1', v_steps_table, v_parent_col)
    USING p_parent_id;

  FOR v_step, v_ord IN
    SELECT t.step, t.ord
    FROM jsonb_array_elements(coalesce(p_steps, '[]'::jsonb))
      WITH ORDINALITY AS t(step, ord)
  LOOP
    EXECUTE format(
      'INSERT INTO %I (%I, position, label, category_id)
       VALUES ($1, $2, $3, $4) RETURNING id',
      v_steps_table, v_parent_col
    )
    INTO v_step_id
    USING
      p_parent_id,
      (v_ord - 1)::integer,
      coalesce(v_step->>'label', ''),
      (v_step->>'category_id')::uuid;

    EXECUTE format(
      'INSERT INTO %I (step_id, set_index, exercise_id)
       SELECT $1, (p->>''set_index'')::integer, (p->>''exercise_id'')::uuid
       FROM jsonb_array_elements($2) AS p',
      v_picks_table
    )
    USING v_step_id, coalesce(v_step->'picks', '[]'::jsonb);
  END LOOP;
END;
$$;

-- A full save of a library sequence: details, per-set measurements and
-- steps together. Raises when the sequence doesn't exist or RLS hides it
-- from the update, so the caller never reports a silent no-op as saved.
--
-- p_measurements: [{ "position": int, "set_index": int, "unit_type": text,
--                    "value": numeric|null, "value_entered_by": text,
--                    "value_unit": text|null }, …]
CREATE OR REPLACE FUNCTION save_sequence(
  p_sequence_id  uuid,
  p_name         text,
  p_description  text,
  p_sets         integer,
  p_measurements jsonb,
  p_steps        jsonb
)
RETURNS sequences
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row sequences;
BEGIN
  UPDATE sequences
  SET name = p_name,
      description = p_description,
      sets = greatest(1, p_sets)
  WHERE id = p_sequence_id
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequence % not found', p_sequence_id
      USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM sequence_measurements WHERE sequence_id = p_sequence_id;
  INSERT INTO sequence_measurements
    (sequence_id, position, set_index, unit_type, value, value_entered_by, value_unit)
  SELECT
    p_sequence_id,
    (m->>'position')::integer,
    (m->>'set_index')::integer,
    m->>'unit_type',
    (m->>'value')::numeric,
    coalesce(m->>'value_entered_by', 'coach'),
    m->>'value_unit'
  FROM jsonb_array_elements(coalesce(p_measurements, '[]'::jsonb)) AS m;

  PERFORM replace_sequence_steps('library', p_sequence_id, p_steps);
  RETURN v_row;
END;
$$;
