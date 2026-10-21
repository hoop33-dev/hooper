-- ============================================================
-- Hooper: teams in packages
-- ============================================================
-- A package can include teams. Buyers count as members of those teams
-- while their purchase is active. Like package programs, this is worked
-- out at read time (team_memberships) instead of being fanned out into
-- team_members rows. One-off packages therefore expire on their own, and
-- a cancelled purchase never removes a member a coach added by hand.

-- ── package_teams ─────────────────────────────────────────────
CREATE TABLE package_teams (
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, team_id)
);

CREATE INDEX idx_package_teams_team ON package_teams(team_id);

ALTER TABLE package_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_teams_select_coaches"
  ON package_teams FOR SELECT TO authenticated
  USING (is_coach());

CREATE POLICY "package_teams_insert_editors"
  ON package_teams FOR INSERT TO authenticated
  WITH CHECK (can_edit_package(package_id));

CREATE POLICY "package_teams_delete_editors"
  ON package_teams FOR DELETE TO authenticated
  USING (can_edit_package(package_id));

-- ── team_memberships ──────────────────────────────────────────
-- Everyone on a team: manual team_members rows, plus athletes holding an
-- active purchase of a package that includes the team. One athlete can
-- appear more than once (added by hand and via a package, or via two
-- packages), so callers dedupe by profile_id.
--
-- The view runs as its owner (it is not security_invoker) because
-- package_purchases RLS only shows a user their own rows. The WHERE clause
-- below re-applies who can read what, matching package_program_ids:
-- coaches see everyone, an athlete sees their own rows, and a parent with
-- an active link sees their child's rows. Manual rows were already
-- readable by all authenticated users, and that stays the same.
CREATE VIEW team_memberships AS
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
    COALESCE(pu.paid_at, pu.created_at),
    'package'::text,
    p.id,
    p.name
  FROM package_purchases pu
  JOIN package_teams pt ON pt.package_id = pu.package_id
  JOIN packages p ON p.id = pu.package_id
  WHERE pu.status IN ('active', 'past_due')
    AND (pu.access_until IS NULL OR pu.access_until > now())
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

REVOKE ALL ON team_memberships FROM PUBLIC, anon;
GRANT SELECT ON team_memberships TO authenticated;

-- ── team_recency ──────────────────────────────────────────────
-- A new buyer counts as a member joining.
CREATE OR REPLACE VIEW team_recency WITH (security_invoker = true) AS
SELECT
  t.id AS team_id,
  t.updated_at,
  tm.last_member_joined_at,
  COALESCE(tm.last_member_joined_at, t.updated_at) AS recency_at
FROM teams t
LEFT JOIN (
  SELECT team_id, MAX(joined_at) AS last_member_joined_at
  FROM team_memberships
  GROUP BY team_id
) tm ON tm.team_id = t.id;

-- ── get_public_package: + teams ───────────────────────────────
-- member_count is worked out here instead of through team_memberships,
-- because the view's checks are based on the caller and the checkout
-- page is anonymous.
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
                     AND pu.status IN ('active', 'past_due')
                     AND (pu.access_until IS NULL OR pu.access_until > now())
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

-- ── my_package_purchases v4: + team_names ─────────────────────
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
  team_names           text[]
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
         ), '{}'::text[])
  FROM package_purchases pu
  JOIN packages p ON p.id = pu.package_id
  JOIN profiles a ON a.id = pu.athlete_profile_id
  WHERE pu.payer_profile_id = get_auth_profile_id()
     OR pu.athlete_profile_id = get_auth_profile_id()
  ORDER BY pu.created_at DESC
$$;

REVOKE ALL ON FUNCTION my_package_purchases() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_package_purchases() TO authenticated;
