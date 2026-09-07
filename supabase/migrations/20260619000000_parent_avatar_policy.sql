-- Allow parents to manage avatar images for their active children.
-- The storage folder name must match the child's profile_id, which must be
-- linked to the authenticated parent via an active parent_player_links row.

CREATE POLICY "avatars_insert_children"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM parent_player_links
      WHERE parent_profile_id = get_auth_profile_id()
        AND player_profile_id::text = (storage.foldername(name))[1]
        AND status = 'active'
    )
  );

CREATE POLICY "avatars_update_children"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM parent_player_links
      WHERE parent_profile_id = get_auth_profile_id()
        AND player_profile_id::text = (storage.foldername(name))[1]
        AND status = 'active'
    )
  );

CREATE POLICY "avatars_delete_children"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM parent_player_links
      WHERE parent_profile_id = get_auth_profile_id()
        AND player_profile_id::text = (storage.foldername(name))[1]
        AND status = 'active'
    )
  );
