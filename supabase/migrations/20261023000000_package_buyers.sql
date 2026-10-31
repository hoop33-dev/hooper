-- ============================================================
-- Hooper: package buyers
-- ============================================================
-- Who has bought each package, for the coach portal's package Buyers tab
-- and active-buyer counts. One row per purchase, so an athlete who bought,
-- lapsed and bought again shows twice. Abandoned checkouts ('incomplete')
-- never became a purchase, so they're left out.

-- ── package_buyers ────────────────────────────────────────────
-- Like package_program_access, the view runs as its owner (not
-- security_invoker) because package_purchases RLS only shows a user their
-- own rows. Unlike that view it's coach-only: athletes and parents see
-- their purchases through my_package_purchases().
--
-- is_active matches package_program_ids: past_due keeps access during
-- Stripe's retry window, and access_until expires one-off packages.
CREATE VIEW package_buyers AS
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
  pu.cancel_at_period_end
FROM package_purchases pu
JOIN profiles a ON a.id = pu.athlete_profile_id
WHERE pu.status <> 'incomplete'
  AND is_coach();

REVOKE ALL ON package_buyers FROM PUBLIC, anon;
GRANT SELECT ON package_buyers TO authenticated;
