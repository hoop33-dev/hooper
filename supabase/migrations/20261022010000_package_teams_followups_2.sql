-- ============================================================
-- Hooper: package teams follow-ups 2
-- ============================================================
-- Fixes on top of 20261021020000_package_teams_followups, which is
-- already applied.

-- ── my_package_purchases: leaving_team_names at the end date ──
-- Stopping a membership takes effect when this purchase ends, not now, so
-- another purchase only keeps the athlete on a team if it still covers
-- them then. One whose access_until falls earlier, or that is itself
-- stopping at an earlier period end, doesn't. A past_due purchase can
-- lapse at any time, so it only counts when this one stops today.
-- The return type is unchanged, so CREATE OR REPLACE is enough.
CREATE OR REPLACE FUNCTION my_package_purchases()
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
                 AND (o.status = 'active' OR e.ends_at <= now())
                 AND (o.access_until IS NULL OR o.access_until > e.ends_at)
                 AND NOT (o.cancel_at_period_end
                          AND o.current_period_end IS NOT NULL
                          AND o.current_period_end <= e.ends_at)
             )
         ), '{}'::text[])
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

-- ── set_program_updated_by: only ON DELETE SET NULL clears it ──
-- 20261021020000 let every non-null → null updated_by write through, so
-- any coach could send updated_by: null and erase the last editor. Only
-- the FK action may clear it now: it runs from the RI trigger on profiles
-- (so trigger depth > 1, unlike a client UPDATE) and the profile is gone.
-- SECURITY DEFINER so profiles RLS can't hide a live profile from the
-- existence check.
CREATE OR REPLACE FUNCTION set_program_updated_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.updated_by IS NULL
     AND OLD.updated_by IS NOT NULL
     AND pg_trigger_depth() > 1
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = OLD.updated_by) THEN
    RETURN NEW;
  END IF;
  NEW.updated_by := COALESCE(
    get_auth_profile_id(),
    CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE OLD.updated_by END
  );
  RETURN NEW;
END;
$$;
