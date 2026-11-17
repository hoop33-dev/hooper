-- ============================================================
-- Hooper: coach-managed memberships
-- ============================================================
-- Coaches can now start, cancel and switch an athlete's packages from the
-- portal (the coach-athlete edge function). A coach-started package can
-- begin later than it is created, and bill later than it begins:
--
--   starts_at  when access unlocks. NULL means "from creation", which is
--              every self-serve checkout and every row written before this.
--   billing_starts_at
--              the first charge. For a subscription that's Stripe's
--              trial_end; for a one-off it's a Stripe invoice scheduled to
--              finalize (and charge the saved card) on that date. NULL
--              means "charged at creation".
--
-- A one-off charged by invoice has no PaymentIntent when it's created, so
-- it's tracked by stripe_invoice_id instead.
--
-- Every "is this purchase live?" check now also waits for starts_at, via
-- purchase_is_live(), so a scheduled package grants nothing until it
-- starts. The objects below are recreated unchanged apart from that.

ALTER TABLE package_purchases
  ADD COLUMN starts_at         timestamptz,
  ADD COLUMN billing_starts_at timestamptz,
  ADD COLUMN stripe_invoice_id text UNIQUE,
  ADD COLUMN created_by_coach  uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE package_purchases DROP CONSTRAINT package_purchases_stripe_ref;
ALTER TABLE package_purchases ADD CONSTRAINT package_purchases_stripe_ref CHECK (
  (kind = 'subscription'
    AND stripe_payment_intent_id IS NULL AND stripe_invoice_id IS NULL)
  OR (kind = 'one_time'
    AND stripe_subscription_id IS NULL
    AND NOT (stripe_payment_intent_id IS NOT NULL AND stripe_invoice_id IS NOT NULL))
);

-- ── purchase_is_live ──────────────────────────────────────────
-- past_due keeps access during Stripe's retry window, access_until expires
-- one-off packages, starts_at holds back a scheduled package.
CREATE OR REPLACE FUNCTION purchase_is_live(
  p_status text,
  p_access_until timestamptz,
  p_starts_at timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_status IN ('active', 'past_due')
     AND (p_access_until IS NULL OR p_access_until > now())
     AND (p_starts_at IS NULL OR p_starts_at <= now())
$$;

-- ── package_program_ids ───────────────────────────────────────
CREATE OR REPLACE FUNCTION package_program_ids(p_athlete_profile_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pp.program_id
  FROM package_purchases pu
  JOIN package_programs pp ON pp.package_id = pu.package_id
  WHERE pu.athlete_profile_id = p_athlete_profile_id
    AND purchase_is_live(pu.status, pu.access_until, pu.starts_at)
    AND (
      p_athlete_profile_id = get_auth_profile_id()
      OR EXISTS (
        SELECT 1 FROM parent_player_links l
        WHERE l.player_profile_id = p_athlete_profile_id
          AND l.parent_profile_id = get_auth_profile_id()
          AND l.status = 'active'
      )
    )
$$;

-- ── team_memberships ──────────────────────────────────────────
-- A scheduled package's members join when it starts.
CREATE OR REPLACE VIEW team_memberships AS
SELECT *
FROM (
  SELECT
    tm.team_id,
    tm.profile_id,
    tm.created_at AS joined_at,
    'manual'::text AS source,
    NULL::uuid AS package_id,
    NULL::text AS package_name
  FROM team_members tm
  UNION ALL
  SELECT
    pt.team_id,
    pu.athlete_profile_id,
    COALESCE(pu.starts_at, pu.paid_at, pu.created_at),
    'package'::text,
    p.id,
    p.name
  FROM package_purchases pu
  JOIN package_teams pt ON pt.package_id = pu.package_id
  JOIN packages p ON p.id = pu.package_id
  WHERE purchase_is_live(pu.status, pu.access_until, pu.starts_at)
) m
WHERE m.source = 'manual'
   OR is_coach()
   OR m.profile_id = get_auth_profile_id()
   OR EXISTS (
     SELECT 1 FROM parent_player_links l
     WHERE l.player_profile_id = m.profile_id
       AND l.parent_profile_id = get_auth_profile_id()
       AND l.status = 'active'
   );

-- ── package_program_access ────────────────────────────────────
CREATE OR REPLACE VIEW package_program_access AS
SELECT *
FROM (
  SELECT
    pu.athlete_profile_id AS profile_id,
    pr.id AS program_id,
    pr.name AS program_name,
    p.id AS package_id,
    p.name AS package_name
  FROM package_purchases pu
  JOIN package_programs pp ON pp.package_id = pu.package_id
  JOIN programs pr ON pr.id = pp.program_id
  JOIN packages p ON p.id = pu.package_id
  WHERE purchase_is_live(pu.status, pu.access_until, pu.starts_at)
) a
WHERE is_coach()
   OR a.profile_id = get_auth_profile_id()
   OR EXISTS (
     SELECT 1 FROM parent_player_links l
     WHERE l.player_profile_id = a.profile_id
       AND l.parent_profile_id = get_auth_profile_id()
       AND l.status = 'active'
   );

-- ── package_buyers: + starts_at ───────────────────────────────
-- CREATE OR REPLACE may only append columns, so starts_at goes last.
-- is_active stays false for a scheduled package until it starts.
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
  pu.starts_at
FROM package_purchases pu
JOIN profiles a ON a.id = pu.athlete_profile_id
JOIN packages pk ON pk.id = pu.package_id
WHERE pu.status <> 'incomplete'
  AND is_coach();

-- ── coach_athlete_programs ────────────────────────────────────
CREATE OR REPLACE FUNCTION coach_athlete_programs(p_profile_ids uuid[])
RETURNS TABLE(profile_id uuid, programs jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH live AS (
    SELECT pu.athlete_profile_id AS profile_id, pu.package_id
    FROM package_purchases pu
    WHERE pu.athlete_profile_id = ANY(p_profile_ids)
      AND purchase_is_live(pu.status, pu.access_until, pu.starts_at)
  ),
  team_links AS (
    SELECT tm.profile_id, tm.team_id
    FROM team_members tm
    WHERE tm.profile_id = ANY(p_profile_ids)
    UNION
    SELECT l.profile_id, pt.team_id
    FROM live l
    JOIN package_teams pt ON pt.package_id = l.package_id
  ),
  sources AS (
    -- 1 direct, 2 package, 3 team: a program reached more than one way is
    -- listed once, under the coach's own assignment when there is one.
    SELECT pa.profile_id, pa.program_id, 1 AS rank
    FROM program_athletes pa
    WHERE pa.profile_id = ANY(p_profile_ids)
    UNION ALL
    SELECT l.profile_id, pp.program_id, 2
    FROM live l
    JOIN package_programs pp ON pp.package_id = l.package_id
    UNION ALL
    SELECT t.profile_id, pt.program_id, 3
    FROM team_links t
    JOIN program_teams pt ON pt.team_id = t.team_id
  ),
  best AS (
    SELECT DISTINCT ON (s.profile_id, s.program_id)
      s.profile_id, s.program_id, s.rank
    FROM sources s
    ORDER BY s.profile_id, s.program_id, s.rank
  )
  SELECT
    b.profile_id,
    jsonb_agg(
      jsonb_build_object('id', pr.id, 'name', pr.name)
      ORDER BY b.rank, pr.name
    )
  FROM best b
  JOIN programs pr ON pr.id = b.program_id
  WHERE is_coach()
  GROUP BY b.profile_id
$$;

-- ── get_public_package: member_count ──────────────────────────
CREATE OR REPLACE FUNCTION get_public_package(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id',               p.id,
    'slug',             p.slug,
    'name',             p.name,
    'price_cents',      p.price_cents,
    'currency',         p.currency,
    'billing_type',     p.billing_type,
    'billing_interval', p.billing_interval,
    'access_weeks',     p.access_weeks,
    'programs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'name',          pr.name,
               'weeks',         pr.weeks,
               'session_count', (SELECT count(*) FROM sessions s WHERE s.program_id = pr.id)
             ) ORDER BY pr.name)
      FROM package_programs pp
      JOIN programs pr ON pr.id = pp.program_id
      WHERE pp.package_id = p.id
    ), '[]'::jsonb),
    'coaches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'first_name', c.first_name,
               'last_name',  c.last_name
             ) ORDER BY c.first_name, c.last_name)
      FROM package_coaches pc
      JOIN profiles c ON c.id = pc.profile_id
      WHERE pc.package_id = p.id
    ), '[]'::jsonb),
    'teams', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'name',         t.name,
               'member_count', (
                 SELECT count(DISTINCT x.profile_id) FROM (
                   SELECT tm.profile_id FROM team_members tm WHERE tm.team_id = t.id
                   UNION
                   SELECT pu.athlete_profile_id
                   FROM package_purchases pu
                   JOIN package_teams pt2 ON pt2.package_id = pu.package_id
                   WHERE pt2.team_id = t.id
                     AND purchase_is_live(pu.status, pu.access_until, pu.starts_at)
                 ) x
               )
             ) ORDER BY t.name)
      FROM package_teams pt
      JOIN teams t ON t.id = pt.team_id
      WHERE pt.package_id = p.id
    ), '[]'::jsonb)
  )
  FROM packages p
  WHERE p.slug = p_slug
    AND p.deleted_at IS NULL
$$;

-- ── my_package_purchases v6: + starts_at ──────────────────────
-- Another purchase only keeps the athlete on a team if it has started by
-- the time this one ends, so switching to a package that starts when this
-- one ends doesn't list its shared teams as "leaving".
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
  starts_at            timestamptz
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
         pu.starts_at
  FROM package_purchases pu
  JOIN packages p ON p.id = pu.package_id
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
