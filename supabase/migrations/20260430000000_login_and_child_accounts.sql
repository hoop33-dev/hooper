-- ============================================================
-- Hooper: Login, Email Verification & Child Account Support
-- ============================================================

-- ── 5.1 Update handle_new_user() to read has_real_email from metadata ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_region_id      uuid;
  v_profile_id     uuid;
  v_has_real_email boolean;
BEGIN
  SELECT id INTO v_region_id
  FROM regions
  WHERE slug = (NEW.raw_user_meta_data->>'region_slug');

  v_has_real_email := COALESCE(
    (NEW.raw_user_meta_data->>'has_real_email')::boolean,
    true
  );

  INSERT INTO profiles (
    auth_user_id, first_name, last_name, username, has_real_email,
    date_of_birth, mobile, region_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username',
    v_has_real_email,
    CASE
      WHEN (NEW.raw_user_meta_data->>'date_of_birth') IS NOT NULL
       AND (NEW.raw_user_meta_data->>'date_of_birth') <> ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'mobile',
    v_region_id
  )
  RETURNING id INTO v_profile_id;

  INSERT INTO user_roles (profile_id, role)
  VALUES (v_profile_id, (NEW.raw_user_meta_data->>'role')::role_type);

  RETURN NEW;
END;
$$;

-- ── 5.2 RLS policy: parent reads child profiles ───────────────
CREATE POLICY "profiles_select_children"
  ON profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT player_profile_id
      FROM parent_player_links
      WHERE status = 'active'
        AND parent_profile_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
    )
  );

-- ── 5.3 View: profile_with_verification ──────────────────────
-- Convenience join used by sign-in flow and auth store.
-- is_verified is true when the user has no real email (child accounts)
-- or when their real email has been confirmed.
-- security_invoker = true ensures the view respects the caller's RLS context
-- on the underlying profiles table, preventing any authenticated user from
-- reading rows they don't own (e.g. another user's auth_email / PII).
CREATE VIEW profile_with_verification WITH (security_invoker = true) AS
SELECT
  p.*,
  (NOT p.has_real_email OR u.email_confirmed_at IS NOT NULL) AS is_verified,
  u.email AS auth_email
FROM profiles p
JOIN auth.users u ON u.id = p.auth_user_id;

GRANT SELECT ON profile_with_verification TO authenticated;
