-- ============================================================
-- Hooper: package teams follow-ups
-- ============================================================
-- Fixes on top of 20261021000000_package_teams and
-- 20261021010000_coaches_manage_all, which are already applied.

-- ── team_member_counts ────────────────────────────────────────
-- Distinct athletes per team, counted here so the portal doesn't page
-- every membership row through PostgREST (and its max-rows cap) to count
-- them. security_invoker, so it sees exactly what team_memberships shows
-- the caller.
CREATE VIEW team_member_counts WITH (security_invoker = true) AS
SELECT team_id, count(DISTINCT profile_id)::int AS member_count
FROM team_memberships
GROUP BY team_id;

REVOKE ALL ON team_member_counts FROM PUBLIC, anon;
GRANT SELECT ON team_member_counts TO authenticated;

-- ── my_package_purchases v5: + leaving_team_names ────────────
-- leaving_team_names is the subset of team_names this purchase is the
-- athlete's only reason for being on (no manual membership, no other
-- active purchase that includes the team), so the cancel sheet only lists
-- teams they would actually leave.
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
  leaving_team_names   text[]
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
                 AND (o.access_until IS NULL OR o.access_until > now())
             )
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

-- ── set_program_updated_by: let ON DELETE SET NULL through ─────
-- Clearing updated_by is how ON DELETE SET NULL reaches the trigger when
-- the last editor's profile is deleted. Restamping it with OLD.updated_by
-- left programs pointing at a deleted profile, so that one write is let
-- through as-is.
CREATE OR REPLACE FUNCTION set_program_updated_by()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.updated_by IS NULL AND OLD.updated_by IS NOT NULL THEN
    RETURN NEW;
  END IF;
  NEW.updated_by := COALESCE(
    get_auth_profile_id(),
    CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE OLD.updated_by END
  );
  RETURN NEW;
END;
$$;
