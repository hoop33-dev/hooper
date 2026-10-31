-- ============================================================
-- Hooper: Exercise video thumbnails (uploaded videos)
-- ============================================================
-- YouTube links get a thumbnail for free from the video id
-- (img.youtube.com/vi/{id}/...); an uploaded file has no such shortcut, so
-- the web portal captures a frame client-side at upload time (see
-- apps/web/src/lib/videoThumbnailCapture.ts) and stores it here, alongside
-- a new storage bucket for the resulting images. Null for "link" videos
-- (mobile derives their thumbnail from the URL instead) and for exercises
-- with no video yet.

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_thumbnail_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-video-thumbnails', 'exercise-video-thumbnails', true, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exercise_video_thumbnails_public_select"
  ON storage.objects FOR SELECT USING (bucket_id = 'exercise-video-thumbnails');
CREATE POLICY "exercise_video_thumbnails_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exercise-video-thumbnails' AND (storage.foldername(name))[1] = get_auth_profile_id()::text);
CREATE POLICY "exercise_video_thumbnails_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-video-thumbnails' AND (storage.foldername(name))[1] = get_auth_profile_id()::text);
