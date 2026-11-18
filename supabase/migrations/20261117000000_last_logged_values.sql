-- ============================================================
-- Hooper: Batched last-logged-value lookup for the session player
-- ============================================================
-- The player pre-fills every measurement the coach left for the athlete
-- to enter with the athlete's most recent logged value for that
-- exercise + unit. That used to be one request per (exercise, unit) pair,
-- often 10-30 parallel requests on every session open. This returns all of
-- them in one call.
--
-- p_exercise_ids and p_unit_types are parallel arrays: element i of each
-- is one (exercise, unit) pair to look up. Pairs with no completed,
-- non-null log are simply absent from the result.
--
-- SECURITY INVOKER, so the existing athlete_measurement_logs RLS policies
-- still decide which rows the caller can read.

CREATE OR REPLACE FUNCTION last_logged_values(
  p_athlete_profile_id uuid,
  p_exercise_ids       uuid[],
  p_unit_types         text[]
)
RETURNS TABLE (exercise_id uuid, unit_type text, actual_value numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (l.exercise_id, l.unit_type)
    l.exercise_id,
    l.unit_type,
    l.actual_value
  FROM athlete_measurement_logs l
  JOIN unnest(p_exercise_ids, p_unit_types) AS k(exercise_id, unit_type)
    ON l.exercise_id = k.exercise_id
   AND l.unit_type = k.unit_type
  WHERE l.athlete_profile_id = p_athlete_profile_id
    AND l.status = 'completed'
    AND l.actual_value IS NOT NULL
  ORDER BY l.exercise_id, l.unit_type, l.logged_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION last_logged_values(uuid, uuid[], text[])
  TO authenticated;
