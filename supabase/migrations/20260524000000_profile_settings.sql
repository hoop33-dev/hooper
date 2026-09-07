-- ============================================================
-- Profile Settings: bio, privacy toggles, avatar storage
-- ============================================================

-- Add profile settings columns
ALTER TABLE profiles
  ADD COLUMN bio        text,
  ADD COLUMN is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN show_age   boolean NOT NULL DEFAULT true,
  ADD COLUMN avatar_url text;

-- ── Supabase Storage bucket for profile photos ───────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read avatars (bucket is public)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can only upload into their own profile folder ({profile_id}/*)
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );
