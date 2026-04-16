-- Add is_locked to profiles if it was created before this column existed.
-- On a fresh reset the column is already present from create_profiles_table;
-- ADD COLUMN IF NOT EXISTS makes this a safe no-op in that case.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- Create (or replace) the under-16 lock function and trigger.
-- Also idempotent: CREATE OR REPLACE + DROP IF EXISTS are both safe to re-run.
CREATE OR REPLACE FUNCTION public.handle_profile_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXTRACT(YEAR FROM AGE(NOW(), NEW.date_of_birth)) < 16 THEN
    NEW.is_locked := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_locked_on_signup ON public.profiles;
CREATE TRIGGER set_locked_on_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_lock();
