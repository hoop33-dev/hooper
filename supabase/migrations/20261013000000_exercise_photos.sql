-- ============================================================
-- Hooper: Exercise photos
-- ============================================================
-- Up to 5 captioned photos per exercise (shooting spots, muscle groups,
-- setup positions), shown after the demo video in this order. Rows are
-- replaced wholesale on save (delete + re-insert, same as
-- exercise_unit_types), so there's no UPDATE policy. The image files live
-- in their own public bucket under {profileId}/{exerciseId}/{uuid}.jpg,
-- uploaded straight from the browser like exercise videos.

CREATE TABLE exercise_photos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id  uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position     integer     NOT NULL CHECK (position BETWEEN 0 AND 4),
  url          text        NOT NULL,
  storage_path text        NOT NULL,
  caption      text        NOT NULL CHECK (char_length(btrim(caption)) BETWEEN 1 AND 40),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, position)
);

ALTER TABLE exercise_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_photos_select_all"
  ON exercise_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercise_photos_insert_own"
  ON exercise_photos FOR INSERT TO authenticated
  WITH CHECK (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "exercise_photos_delete_own"
  ON exercise_photos FOR DELETE TO authenticated
  USING (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );

-- ── Storage: exercise-photos bucket ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-photos', 'exercise-photos', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exercise_photos_storage_public_select"
  ON storage.objects FOR SELECT USING (bucket_id = 'exercise-photos');
CREATE POLICY "exercise_photos_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = get_auth_profile_id()::text);
-- Included up front (unlike exercise-video-thumbnails, which needed a later
-- fix) so any upsert onto an existing path isn't silently rejected.
CREATE POLICY "exercise_photos_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = get_auth_profile_id()::text)
  WITH CHECK (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = get_auth_profile_id()::text);
CREATE POLICY "exercise_photos_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = get_auth_profile_id()::text);
