-- Package switches: a coach's switch cancels the old purchase and starts a
-- new one; the old row now points at the new one, so it can read
-- "Switching to X" while its cancel is pending and "Switched to X" once it
-- has ended. Cleared again if the old membership is kept.
ALTER TABLE package_purchases
  ADD COLUMN switched_to_purchase_id uuid
    REFERENCES package_purchases(id) ON DELETE SET NULL,
  ADD COLUMN switched_at timestamptz;

CREATE INDEX package_purchases_switched_to_idx
  ON package_purchases (switched_to_purchase_id)
  WHERE switched_to_purchase_id IS NOT NULL;

-- ── package_buyers: + switched_to_package_name ────────────────
-- CREATE OR REPLACE may only append columns, so it goes last.
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
  purchase_is_live(pu.status, pu.access_until, pu.starts_at) AS is_active,
  pu.created_at,
  pu.paid_at,
  pu.current_period_end,
  pu.access_until,
  pu.canceled_at,
  pu.cancel_at_period_end,
  pk.slug AS package_slug,
  pu.starts_at,
  swp.name AS switched_to_package_name
FROM package_purchases pu
JOIN profiles a ON a.id = pu.athlete_profile_id
JOIN packages pk ON pk.id = pu.package_id
LEFT JOIN package_purchases sw ON sw.id = pu.switched_to_purchase_id
LEFT JOIN packages swp ON swp.id = sw.package_id
WHERE pu.status <> 'incomplete'
  AND is_coach();

-- ── my_package_purchases v7: + switched_to_package_name ───────
-- The return type changes, so drop and recreate.
DROP FUNCTION my_package_purchases();

CREATE FUNCTION my_package_purchases()
RETURNS TABLE (
  id                   uuid,
  package_id           uuid,
  package_name         text,
  package_slug         text,
  billing_type         text,
  billing_interval     text,
  access_weeks         integer,
  payer_profile_id     uuid,
  athlete_profile_id   uuid,
  athlete_first_name   text,
  athlete_last_name    text,
  athlete_username     text,
  kind                 text,
  status               text,
  amount_cents         integer,
  currency             text,
  current_period_end   timestamptz,
  access_until         timestamptz,
  paid_at              timestamptz,
  canceled_at          timestamptz,
  cancel_at_period_end boolean,
  created_at           timestamptz,
  program_names        text[],
  coach_names          text[],
  team_names           text[],
  leaving_team_names   text[],
  starts_at            timestamptz,
  switched_to_package_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.id, pu.package_id, p.name, p.slug, p.billing_type,
         p.billing_interval, p.access_weeks,
         pu.payer_profile_id, pu.athlete_profile_id,
         a.first_name, a.last_name, a.username,
         pu.kind, pu.status, pu.amount_cents, pu.currency,
         pu.current_period_end, pu.access_until, pu.paid_at,
         pu.canceled_at, pu.cancel_at_period_end, pu.created_at,
         COALESCE((
           SELECT array_agg(pr.name ORDER BY pr.name)
           FROM package_programs pp
           JOIN programs pr ON pr.id = pp.program_id
           WHERE pp.package_id = p.id
         ), '{}'::text[]),
         COALESCE((
           SELECT array_agg(
                    btrim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))
                    ORDER BY c.first_name, c.last_name)
           FROM package_coaches pc
           JOIN profiles c ON c.id = pc.profile_id
           WHERE pc.package_id = p.id
         ), '{}'::text[]),
         COALESCE((
           SELECT array_agg(t.name ORDER BY t.name)
           FROM package_teams pt
           JOIN teams t ON t.id = pt.team_id
           WHERE pt.package_id = p.id
         ), '{}'::text[]),
         COALESCE((
           SELECT array_agg(t.name ORDER BY t.name)
           FROM package_teams pt
           JOIN teams t ON t.id = pt.team_id
           WHERE pt.package_id = p.id
             AND NOT EXISTS (
               SELECT 1 FROM team_members tm
               WHERE tm.team_id = t.id
                 AND tm.profile_id = pu.athlete_profile_id
             )
             AND NOT EXISTS (
               SELECT 1
               FROM package_purchases o
               JOIN package_teams opt ON opt.package_id = o.package_id
               WHERE o.id <> pu.id
                 AND o.athlete_profile_id = pu.athlete_profile_id
                 AND opt.team_id = t.id
                 AND o.status IN ('active', 'past_due')
                 AND (o.status = 'active' OR e.ends_at <= now())
                 AND (o.access_until IS NULL OR o.access_until > e.ends_at)
                 AND (o.starts_at IS NULL OR o.starts_at <= e.ends_at)
                 AND NOT (o.cancel_at_period_end
                          AND o.current_period_end IS NOT NULL
                          AND o.current_period_end <= e.ends_at)
             )
         ), '{}'::text[]),
         pu.starts_at,
         swp.name
  FROM package_purchases pu
  JOIN packages p ON p.id = pu.package_id
  LEFT JOIN package_purchases sw ON sw.id = pu.switched_to_purchase_id
  LEFT JOIN packages swp ON swp.id = sw.package_id
  JOIN profiles a ON a.id = pu.athlete_profile_id
  -- When stopping this purchase actually removes access: the end of the
  -- paid period (or one-off access_until), or today for a failed charge.
  CROSS JOIN LATERAL (
    SELECT CASE
             WHEN pu.status = 'active'
               THEN GREATEST(now(), COALESCE(pu.current_period_end, pu.access_until, now()))
             ELSE now()
           END AS ends_at
  ) e
  WHERE pu.payer_profile_id = get_auth_profile_id()
     OR pu.athlete_profile_id = get_auth_profile_id()
  ORDER BY pu.created_at DESC
$$;

REVOKE ALL ON FUNCTION my_package_purchases() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_package_purchases() TO authenticated;
