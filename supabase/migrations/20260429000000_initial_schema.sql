-- ============================================================
-- Hooper: Initial Schema
-- ============================================================

-- ── Utility: stamp updated_at on row change ───────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Regions ──────────────────────────────────────────────────
CREATE TABLE regions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO regions (name, slug) VALUES
  ('Northland',           'northland'),
  ('Auckland',            'auckland'),
  ('Waikato',             'waikato'),
  ('Bay of Plenty',       'bay-of-plenty'),
  ('Gisborne',            'gisborne'),
  ('Hawke''s Bay',        'hawkes-bay'),
  ('Taranaki',            'taranaki'),
  ('Manawatu-Whanganui',  'manawatu-whanganui'),
  ('Wellington',          'wellington'),
  ('Tasman',              'tasman'),
  ('Nelson',              'nelson'),
  ('Marlborough',         'marlborough'),
  ('West Coast',          'west-coast'),
  ('Canterbury',          'canterbury'),
  ('Otago',               'otago'),
  ('Southland',           'southland');

-- ── Enums ─────────────────────────────────────────────────────
CREATE TYPE role_type   AS ENUM ('player', 'coach', 'parent');
CREATE TYPE link_status AS ENUM ('active', 'disconnected');

-- ── Profiles ──────────────────────────────────────────────────
-- Single source of truth for all user data.
-- auth_user_id is the FK into auth.users — never query auth.users directly
-- from the app layer; always join through profiles.
-- has_real_email = false for child accounts that use a generated fake email.
CREATE TABLE profiles (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id   uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name     text        NOT NULL,
  last_name      text        NOT NULL,
  username       text        NOT NULL UNIQUE,
  has_real_email boolean     NOT NULL DEFAULT true,
  date_of_birth  date,
  mobile         text,
  region_id      uuid        REFERENCES regions(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── User roles ────────────────────────────────────────────────
-- One row per role per person. A coach who also plays has two rows.
CREATE TABLE user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       role_type   NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, role)
);

-- ── Parent–player links ───────────────────────────────────────
-- UNIQUE (player_profile_id): V1 constraint — one parent per child.
-- Drop this constraint when multi-parent support is needed.
CREATE TABLE parent_player_links (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            link_status NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_profile_id)
);

CREATE TRIGGER set_parent_player_links_updated_at
  BEFORE UPDATE ON parent_player_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Trigger: auto-create profile on auth signup ───────────────
-- Fires on auth.users INSERT.  All profile fields are passed via
-- raw_user_meta_data in the signUp call options.data payload.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_region_id  uuid;
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_region_id
  FROM   regions
  WHERE  slug = (NEW.raw_user_meta_data->>'region_slug');

  INSERT INTO profiles (
    auth_user_id,
    first_name,
    last_name,
    username,
    has_real_email,
    date_of_birth,
    mobile,
    region_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username',
    true,
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
  VALUES (
    v_profile_id,
    (NEW.raw_user_meta_data->>'role')::role_type
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── RPC: check username availability (bypasses RLS safely) ────
-- Returns true if the username is not taken.
CREATE OR REPLACE FUNCTION is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = lower(p_username)
  );
$$;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE regions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player_links ENABLE ROW LEVEL SECURITY;

-- Regions: readable by all authenticated users
CREATE POLICY "regions_select"
  ON regions FOR SELECT TO authenticated
  USING (true);

-- Profiles: read and update own row only
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- User roles: read own roles only
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Parent–player links: parents read their own links
CREATE POLICY "parent_player_links_select_parent"
  ON parent_player_links FOR SELECT TO authenticated
  USING (
    parent_profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );
