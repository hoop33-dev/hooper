-- ============================================================
-- Hooper: Packages (billing phase 1)
-- ============================================================
-- Coach-defined, sellable bundles of programs + coaches. This phase is
-- coach-side only: create/edit/delete packages and attach programs and
-- coaches. Purchases, Stripe, and the public /start?package=<slug> page come
-- later — the columns here are shaped so they map straight onto Stripe
-- Prices (amount in cents + currency + recurring interval or one-off).
--
-- slug is the public link id. It is permanent (a trigger rejects changes)
-- and never reusable: packages are soft-deleted via deleted_at, so the
-- UNIQUE constraint keeps holding the slug after deletion and a shared link
-- can later resolve to "no longer available" rather than a different
-- package.
--
-- Access: any coach can read live packages (same all-coaches read model as
-- teams/programs until an "organizations" concept exists). Writes are
-- limited to the creator and any coach attached via package_coaches —
-- checked through can_edit_package(), a SECURITY DEFINER helper so the
-- packages <-> package_coaches policies don't recurse into each other.

CREATE TABLE packages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE
                     CHECK (
                       char_length(slug) BETWEEN 3 AND 40
                       AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                     ),
  name             text NOT NULL CHECK (char_length(btrim(name)) > 0),
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  currency         text NOT NULL DEFAULT 'nzd',
  billing_type     text NOT NULL
                     CHECK (billing_type IN ('recurring', 'one_time')),
  billing_interval text
                     CHECK (billing_interval IN ('week', 'month', 'quarter', 'year')),
  access_weeks     integer CHECK (access_weeks >= 1),
  created_by       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  -- Recurring packages bill every interval with open-ended access. One-off
  -- packages grant access_weeks of access, or unlimited access when it's
  -- null. ('quarter' maps to a Stripe month interval with interval_count 3.)
  CONSTRAINT packages_billing_shape CHECK (
    (billing_type = 'recurring'
      AND billing_interval IS NOT NULL AND access_weeks IS NULL)
    OR (billing_type = 'one_time' AND billing_interval IS NULL)
  )
);

CREATE INDEX idx_packages_created_by ON packages(created_by);

CREATE TRIGGER set_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION packages_slug_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'A package ID cannot be changed'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER packages_slug_immutable
  BEFORE UPDATE OF slug ON packages
  FOR EACH ROW EXECUTE FUNCTION packages_slug_immutable();

CREATE TABLE package_programs (
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, program_id)
);

CREATE INDEX idx_package_programs_program_id ON package_programs(program_id);

CREATE TABLE package_coaches (
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, profile_id)
);

CREATE INDEX idx_package_coaches_profile_id ON package_coaches(profile_id);

-- ── helpers ───────────────────────────────────────────────────
-- SECURITY DEFINER for the same reason as is_coach(): the packages UPDATE
-- policy needs to read package_coaches, and the package_coaches write
-- policies need to read packages — routing both through a definer function
-- sidesteps RLS for the lookup and avoids policy recursion.
CREATE OR REPLACE FUNCTION can_edit_package(p_package_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM packages p
    WHERE p.id = p_package_id
      AND p.deleted_at IS NULL
      AND (
        p.created_by = get_auth_profile_id()
        OR EXISTS (
          SELECT 1 FROM package_coaches pc
          WHERE pc.package_id = p.id
            AND pc.profile_id = get_auth_profile_id()
        )
      )
  )
$$;

-- Soft-deleted rows are invisible through RLS but still hold their slug, so
-- the create form's live "Already in use" check has to look past RLS.
CREATE OR REPLACE FUNCTION package_slug_available(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_coach()
    AND NOT EXISTS (SELECT 1 FROM packages WHERE slug = p_slug)
$$;

-- ── RLS: packages ─────────────────────────────────────────────
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select_coaches"
  ON packages FOR SELECT TO authenticated
  USING (is_coach() AND deleted_at IS NULL);

CREATE POLICY "packages_insert_own"
  ON packages FOR INSERT TO authenticated
  WITH CHECK (is_coach() AND created_by = get_auth_profile_id());

-- WITH CHECK re-runs can_edit_package() against the new row, which is
-- false once deleted_at is set — so a plain UPDATE can't soft-delete (it
-- would also fail the deleted_at IS NULL SELECT policy on the new row).
-- Deletion goes through soft_delete_package() below instead.
CREATE POLICY "packages_update_editors"
  ON packages FOR UPDATE TO authenticated
  USING (can_edit_package(id))
  WITH CHECK (can_edit_package(id));

-- No DELETE policy: packages are soft-deleted so slugs are never reused.
CREATE OR REPLACE FUNCTION soft_delete_package(p_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT can_edit_package(p_package_id) THEN
    RAISE EXCEPTION 'Package not found or not editable'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE packages SET deleted_at = now() WHERE id = p_package_id;
END;
$$;

-- ── RLS: package_programs ─────────────────────────────────────
ALTER TABLE package_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_programs_select_coaches"
  ON package_programs FOR SELECT TO authenticated
  USING (is_coach());

CREATE POLICY "package_programs_insert_editors"
  ON package_programs FOR INSERT TO authenticated
  WITH CHECK (can_edit_package(package_id));

CREATE POLICY "package_programs_delete_editors"
  ON package_programs FOR DELETE TO authenticated
  USING (can_edit_package(package_id));

-- ── RLS: package_coaches ──────────────────────────────────────
ALTER TABLE package_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_coaches_select_coaches"
  ON package_coaches FOR SELECT TO authenticated
  USING (is_coach());

-- The creator's own row is inserted straight after the package itself, so
-- can_edit_package() (creator branch) already passes. Only coaches can be
-- attached.
CREATE POLICY "package_coaches_insert_editors"
  ON package_coaches FOR INSERT TO authenticated
  WITH CHECK (
    can_edit_package(package_id)
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.profile_id = package_coaches.profile_id
        AND ur.role = 'coach'
    )
  );

CREATE POLICY "package_coaches_delete_editors"
  ON package_coaches FOR DELETE TO authenticated
  USING (can_edit_package(package_id));
