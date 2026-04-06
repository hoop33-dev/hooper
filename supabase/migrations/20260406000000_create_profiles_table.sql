-- Create profiles table
-- Stores user profile data collected during registration.
-- Supabase Auth (auth.users) handles email and password; this table supplements it.
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name   TEXT        NOT NULL,
  last_name    TEXT        NOT NULL,
  date_of_birth DATE       NOT NULL,
  phone        TEXT,
  region       TEXT        NOT NULL,
  -- Parent/guardian fields — required at the application layer when date_of_birth
  -- indicates the user is under 16 years of age.
  parent_name  TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row-level security: users may only access their own profile row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
