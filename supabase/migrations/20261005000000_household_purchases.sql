-- ============================================================
-- Hooper: Household billing (billing phase 3)
-- ============================================================
-- The billing portal lets any athlete buy packages for children they manage
-- and see their household in one place. There's no separate "parent"
-- account type any more — every account is an athlete, and anyone may have
-- children. The `parent` role survives only as a cheap marker meaning "has
-- at least one linked child" (create-child-account adds it; the backfill
-- below covers existing guardians). The mobile app picks the *earliest*
-- role as primary, so an athlete who gains `parent` keeps their athlete
-- experience.

-- ── Backfill the parent marker ────────────────────────────────
INSERT INTO user_roles (profile_id, role)
SELECT DISTINCT parent_profile_id, 'parent'::role_type
FROM parent_player_links
WHERE status = 'active'
ON CONFLICT (profile_id, role) DO NOTHING;

-- ── my_children ───────────────────────────────────────────────
-- The caller's actively linked children, for the household roster and the
-- checkout "who's this for?" picker. SECURITY DEFINER so it doesn't depend
-- on the shape of the profiles RLS policies; it only ever answers for the
-- caller's own links.
CREATE OR REPLACE FUNCTION my_children()
RETURNS TABLE (
  profile_id     uuid,
  first_name     text,
  last_name      text,
  username       text,
  date_of_birth  date,
  region_id      uuid,
  has_real_email boolean,
  linked_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.first_name, c.last_name, c.username, c.date_of_birth,
         c.region_id, c.has_real_email, l.created_at
  FROM parent_player_links l
  JOIN profiles c ON c.id = l.player_profile_id
  WHERE l.parent_profile_id = get_auth_profile_id()
    AND l.status = 'active'
  ORDER BY c.first_name, c.last_name
$$;

REVOKE ALL ON FUNCTION my_children() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_children() TO authenticated;

-- ── my_package_purchases (v2) ─────────────────────────────────
-- Adds who each purchase is for (a payer now sees their children's
-- purchases alongside their own) plus the package's billing shape for
-- household totals. The return type changes, so drop and recreate.
DROP FUNCTION my_package_purchases();

CREATE FUNCTION my_package_purchases()
RETURNS TABLE (
  id                 uuid,
  package_id         uuid,
  package_name       text,
  package_slug       text,
  billing_type       text,
  billing_interval   text,
  access_weeks       integer,
  athlete_profile_id uuid,
  athlete_first_name text,
  athlete_last_name  text,
  athlete_username   text,
  kind               text,
  status             text,
  amount_cents       integer,
  currency           text,
  current_period_end timestamptz,
  access_until       timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.id, pu.package_id, p.name, p.slug, p.billing_type,
         p.billing_interval, p.access_weeks,
         pu.athlete_profile_id, a.first_name, a.last_name, a.username,
         pu.kind, pu.status, pu.amount_cents, pu.currency,
         pu.current_period_end, pu.access_until, pu.paid_at, pu.created_at
  FROM package_purchases pu
  JOIN packages p ON p.id = pu.package_id
  JOIN profiles a ON a.id = pu.athlete_profile_id
  WHERE pu.payer_profile_id = get_auth_profile_id()
     OR pu.athlete_profile_id = get_auth_profile_id()
  ORDER BY pu.created_at DESC
$$;

REVOKE ALL ON FUNCTION my_package_purchases() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_package_purchases() TO authenticated;
