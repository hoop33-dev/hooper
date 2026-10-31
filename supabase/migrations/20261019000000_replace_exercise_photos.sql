-- ============================================================
-- Hooper: Atomic exercise photo replace
-- ============================================================
-- Saving photos used to be a delete then an insert in two separate
-- requests, so a failed insert left the exercise with no photo rows at all.
-- This does both in one transaction. SECURITY INVOKER so the existing
-- exercise_photos insert/delete RLS policies still decide ownership — a
-- non-owner's delete matches nothing and their insert raises, rolling back.
--
-- p_photos: [{ "storage_path": text, "url": text, "caption": text }, …] in
-- display order; position is taken from the array index.

CREATE OR REPLACE FUNCTION replace_exercise_photos(
  p_exercise_id uuid,
  p_photos      jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM exercise_photos WHERE exercise_id = p_exercise_id;

  INSERT INTO exercise_photos (exercise_id, position, storage_path, url, caption)
  SELECT
    p_exercise_id,
    (t.ord - 1)::integer,
    t.photo->>'storage_path',
    t.photo->>'url',
    btrim(t.photo->>'caption')
  FROM jsonb_array_elements(coalesce(p_photos, '[]'::jsonb))
    WITH ORDINALITY AS t(photo, ord);
END;
$$;
