-- ============================================================
-- Hooper: Cancel memberships from the billing portal (billing phase 4)
-- ============================================================
-- The payer can stop a monthly membership. It cancels at the end of the
-- paid period (Stripe cancel_at_period_end), so the row stays 'active' with
-- cancel_at_period_end = true until Stripe deletes the subscription and the
-- webhook moves it to 'canceled'. "Keep membership" clears the flag again.
-- A past_due membership has no paid period left, so it's cancelled
-- outright. Written only by the billing-membership edge function and the
-- Stripe webhook (service role).

ALTER TABLE package_purchases
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN cancel_reason        text
    CHECK (cancel_reason IS NULL OR char_length(cancel_reason) <= 60);

-- ── my_package_purchases (v3) ─────────────────────────────────
-- Adds the payer (only they may cancel), the pending-cancel flag and the
-- package's programs and coaches for the membership cards. The return type
-- changes, so drop and recreate.
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
  coach_names          text[]
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
