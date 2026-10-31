-- ============================================================
-- Coaches manage athletes from the portal's athlete page
-- ============================================================
-- 1. coach_audit_log: who changed what on whose account.
-- 2. coach_athlete_account(): the account facts the Details tab shows
--    (email, joined, last sign-in, linked parent), coach-only.
-- 3. coach_update_athlete_profile(): a whitelisted profile edit, coach-only.
--
-- Like the rest of the portal there's no organisation scoping yet — any
-- coach can manage any athlete (see 20261021010000_coaches_manage_all.sql).
-- Email is deliberately NOT editable here: a coach who could set an
-- athlete's email could then send a password reset to themselves and take
-- over the account (and the card saved on it).

-- ── 1. Audit log ──────────────────────────────────────────────
-- Written only by SECURITY DEFINER functions and the coach-athlete edge
-- function (service role). RLS on with no policies: nobody reads it through
-- the API for now.
CREATE TABLE coach_audit_log (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_profile_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action             text        NOT NULL,
  details            jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coach_audit_log_athlete_idx
  ON coach_audit_log (athlete_profile_id, created_at DESC);

ALTER TABLE coach_audit_log ENABLE ROW LEVEL SECURITY;

-- ── 2. Account facts ──────────────────────────────────────────
-- auth.users isn't readable by `authenticated` (see
-- get_athlete_last_sign_ins in 20260725000000_athletes_and_teams.sql), so
-- the email and last sign-in come through a definer function gated by
-- is_coach(). A child account's email is a placeholder
-- (<username>@children.hoop33.co.nz), so it comes back null.
CREATE OR REPLACE FUNCTION coach_athlete_account(p_profile_id uuid)
RETURNS TABLE(
  email           text,
  has_real_email  boolean,
  joined_at       timestamptz,
  last_sign_in_at timestamptz,
  parent_name     text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN p.has_real_email THEN u.email::text END,
    p.has_real_email,
    p.created_at,
    u.last_sign_in_at,
    (
      SELECT trim(pp.first_name || ' ' || pp.last_name)
      FROM parent_player_links l
      JOIN profiles pp ON pp.id = l.parent_profile_id
      WHERE l.player_profile_id = p.id AND l.status = 'active'
      LIMIT 1
    )
  FROM profiles p
  JOIN auth.users u ON u.id = p.auth_user_id
  WHERE p.id = p_profile_id AND is_coach()
$$;

REVOKE ALL ON FUNCTION coach_athlete_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION coach_athlete_account(uuid) TO authenticated;

-- ── 3. Profile edit ───────────────────────────────────────────
-- Only these columns, and never another coach's profile. Usernames follow
-- the app's rule (lowercase letters, digits, underscore; 30 max) when they
-- change; existing usernames that predate the rule are left alone. Changing
-- a child's username is safe — sign-in resolves username → auth email, and
-- the placeholder email isn't derived from it after creation (parents
-- already do this via update-child-profile).
--
-- Errors: 42501 not a coach / coach target, 22023 invalid field,
-- 23505 username taken (the unique constraint's own error).
CREATE OR REPLACE FUNCTION coach_update_athlete_profile(
  p_profile_id    uuid,
  p_first_name    text,
  p_last_name     text,
  p_username      text,
  p_mobile        text,
  p_date_of_birth date,
  p_region_id     uuid,
  p_bio           text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach    uuid := get_auth_profile_id();
  v_old      profiles%ROWTYPE;
  v_username text := lower(trim(coalesce(p_username, '')));
  v_first    text := trim(coalesce(p_first_name, ''));
  v_last     text := trim(coalesce(p_last_name, ''));
  v_mobile   text := nullif(trim(coalesce(p_mobile, '')), '');
  v_bio      text := nullif(trim(coalesce(p_bio, '')), '');
  v_changes  jsonb;
BEGIN
  IF v_coach IS NULL OR NOT is_coach() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_old FROM profiles WHERE id = p_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Athlete not found' USING ERRCODE = '22023';
  END IF;

  IF p_profile_id <> v_coach AND EXISTS (
    SELECT 1 FROM user_roles WHERE profile_id = p_profile_id AND role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Coach profiles can''t be edited here' USING ERRCODE = '42501';
  END IF;

  IF v_first = '' OR v_last = '' THEN
    RAISE EXCEPTION 'First and last name are required' USING ERRCODE = '22023';
  END IF;
  IF length(v_first) > 50 OR length(v_last) > 50 THEN
    RAISE EXCEPTION 'Names must be 50 characters or fewer' USING ERRCODE = '22023';
  END IF;
  IF v_username <> v_old.username AND v_username !~ '^[a-z0-9_]{1,30}$' THEN
    RAISE EXCEPTION 'Usernames use letters, numbers and _ (30 max)' USING ERRCODE = '22023';
  END IF;
  IF v_mobile IS NOT NULL AND length(v_mobile) > 30 THEN
    RAISE EXCEPTION 'Mobile number is too long' USING ERRCODE = '22023';
  END IF;
  IF v_bio IS NOT NULL AND length(v_bio) > 500 THEN
    RAISE EXCEPTION 'Bio must be 500 characters or fewer' USING ERRCODE = '22023';
  END IF;
  IF p_date_of_birth IS NOT NULL AND p_date_of_birth > current_date THEN
    RAISE EXCEPTION 'Date of birth can''t be in the future' USING ERRCODE = '22023';
  END IF;

  UPDATE profiles SET
    first_name    = v_first,
    last_name     = v_last,
    username      = v_username,
    mobile        = v_mobile,
    date_of_birth = p_date_of_birth,
    region_id     = p_region_id,
    bio           = v_bio
  WHERE id = p_profile_id;

  -- { field: [old, new] } for whatever actually changed.
  SELECT coalesce(jsonb_object_agg(k, jsonb_build_array(o, n)), '{}'::jsonb)
  INTO v_changes
  FROM (VALUES
    ('first_name',    to_jsonb(v_old.first_name),    to_jsonb(v_first)),
    ('last_name',     to_jsonb(v_old.last_name),     to_jsonb(v_last)),
    ('username',      to_jsonb(v_old.username),      to_jsonb(v_username)),
    ('mobile',        to_jsonb(v_old.mobile),        to_jsonb(v_mobile)),
    ('date_of_birth', to_jsonb(v_old.date_of_birth), to_jsonb(p_date_of_birth)),
    ('region_id',     to_jsonb(v_old.region_id),     to_jsonb(p_region_id)),
    ('bio',           to_jsonb(v_old.bio),           to_jsonb(v_bio))
  ) AS f(k, o, n)
  WHERE o IS DISTINCT FROM n;

  IF v_changes <> '{}'::jsonb THEN
    INSERT INTO coach_audit_log (coach_profile_id, athlete_profile_id, action, details)
    VALUES (v_coach, p_profile_id, 'profile_update', v_changes);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION coach_update_athlete_profile(uuid, text, text, text, text, date, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION coach_update_athlete_profile(uuid, text, text, text, text, date, uuid, text) TO authenticated;
