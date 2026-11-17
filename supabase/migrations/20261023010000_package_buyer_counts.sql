-- ============================================================
-- Hooper: package buyer counts
-- ============================================================
-- The portal used to count buyers by pulling every package_buyers row and
-- tallying in JS, which PostgREST's max-rows cap silently truncates. Counts
-- now come grouped from the database, and both views carry the package slug
-- so a package page (which only has the slug from its URL) can query them in
-- parallel with the package itself.

-- ── package_buyers: + package_slug ────────────────────────────
-- CREATE OR REPLACE may only append columns, so package_slug goes last.
CREATE OR REPLACE VIEW package_buyers AS
SELECT
  pu.id AS purchase_id,
  pu.package_id,
  pu.athlete_profile_id AS profile_id,
  a.first_name,
  a.last_name,
  a.username,
  a.avatar_url,
  pu.kind,
  pu.status,
  (pu.status IN ('active', 'past_due')
    AND (pu.access_until IS NULL OR pu.access_until > now())) AS is_active,
  pu.created_at,
  pu.paid_at,
  pu.current_period_end,
  pu.access_until,
  pu.canceled_at,
  pu.cancel_at_period_end,
  pk.slug AS package_slug
FROM package_purchases pu
JOIN profiles a ON a.id = pu.athlete_profile_id
JOIN packages pk ON pk.id = pu.package_id
WHERE pu.status <> 'incomplete'
  AND is_coach();

-- ── package_buyer_counts ──────────────────────────────────────
-- One row per live package that has at least one purchase. Runs as its
-- owner like package_buyers (whose is_coach() check it inherits), so
-- soft-deleted packages are filtered here rather than by packages RLS.
CREATE VIEW package_buyer_counts AS
SELECT
  b.package_id,
  b.package_slug,
  (count(DISTINCT b.profile_id) FILTER (WHERE b.is_active))::int
    AS active_buyers,
  count(*)::int AS purchases
FROM package_buyers b
JOIN packages pk ON pk.id = b.package_id
WHERE pk.deleted_at IS NULL
GROUP BY b.package_id, b.package_slug;

REVOKE ALL ON package_buyer_counts FROM PUBLIC, anon;
GRANT SELECT ON package_buyer_counts TO authenticated;
