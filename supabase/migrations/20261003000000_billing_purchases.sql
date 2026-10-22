-- ============================================================
-- Hooper: Package purchases (billing phase 2)
-- ============================================================
-- Athletes buy packages through the billing portal (apps/billing), paying
-- via Stripe. Every Stripe object is created and synced by edge functions
-- (billing-checkout, billing-payment-method, stripe-webhook) running with
-- the service role — clients can read their own rows but never write them.
--
-- payer_profile_id vs athlete_profile_id: today they're always the same
-- person ("buying for me"). They're split now so buying on behalf of a
-- child later needs no migration — access keys off athlete, billing keys
-- off payer.
--
-- Access is evaluated at read time (package_program_ids) rather than
-- fanned out into program_athletes rows, so one-off packages expire on
-- their own without a cron job and a coach's manual assignment is never
-- clobbered by a purchase being cancelled.

-- ── billing_customers ─────────────────────────────────────────
-- One Stripe Customer per paying profile.
CREATE TABLE billing_customers (
  profile_id         uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_customers_select_own"
  ON billing_customers FOR SELECT TO authenticated
  USING (profile_id = get_auth_profile_id());

-- ── package_purchases ─────────────────────────────────────────
-- kind 'subscription' ↔ a recurring package (Stripe Subscription);
-- kind 'one_time' ↔ a one-off package (Stripe PaymentIntent) whose access
-- runs until access_until (null = unlimited).
CREATE TABLE package_purchases (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id               uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  payer_profile_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_profile_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind                     text NOT NULL CHECK (kind IN ('subscription', 'one_time')),
  status                   text NOT NULL DEFAULT 'incomplete'
                             CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled', 'expired')),
  stripe_subscription_id   text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  amount_cents             integer NOT NULL CHECK (amount_cents >= 0),
  currency                 text NOT NULL,
  current_period_end       timestamptz,
  paid_at                  timestamptz,
  access_until             timestamptz,
  canceled_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_purchases_stripe_ref CHECK (
    (kind = 'subscription' AND stripe_payment_intent_id IS NULL)
    OR (kind = 'one_time' AND stripe_subscription_id IS NULL)
  )
);

CREATE INDEX idx_package_purchases_payer   ON package_purchases(payer_profile_id);
CREATE INDEX idx_package_purchases_athlete ON package_purchases(athlete_profile_id);
CREATE INDEX idx_package_purchases_package ON package_purchases(package_id);

-- At most one live purchase of a package per athlete: blocks double-buying
-- and lets checkout resume an abandoned 'incomplete' attempt instead of
-- creating a second Stripe object.
CREATE UNIQUE INDEX uniq_package_purchases_live
  ON package_purchases(athlete_profile_id, package_id)
  WHERE status IN ('incomplete', 'active', 'past_due');

CREATE TRIGGER set_package_purchases_updated_at
  BEFORE UPDATE ON package_purchases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_purchases_select_own"
  ON package_purchases FOR SELECT TO authenticated
  USING (
    payer_profile_id = get_auth_profile_id()
    OR athlete_profile_id = get_auth_profile_id()
  );

-- ── get_public_package ────────────────────────────────────────
-- The public checkout page (anon) needs a package's display data, but the
-- packages tables are coach-only under RLS. Expose exactly what the page
-- renders. Returns null for unknown or soft-deleted slugs so a stale link
-- can say "no longer available".
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
    ), '[]'::jsonb)
  )
  FROM packages p
  WHERE p.slug = p_slug
    AND p.deleted_at IS NULL
$$;

REVOKE ALL ON FUNCTION get_public_package(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_package(text) TO anon, authenticated;

-- ── package_program_ids ───────────────────────────────────────
-- Programs an athlete can train via a purchased package. The mobile app
-- loads program lists per profile (a parent can view a linked child's), so
-- this takes the athlete id and only answers for the caller themself or an
-- actively-linked parent — anyone else gets an empty set. past_due keeps
-- access during Stripe's retry window; access_until expires one-off
-- packages at read time. SECURITY DEFINER because package_programs is
-- coach-only under RLS.
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
    AND pu.status IN ('active', 'past_due')
    AND (pu.access_until IS NULL OR pu.access_until > now())
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

REVOKE ALL ON FUNCTION package_program_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION package_program_ids(uuid) TO authenticated;

-- ── my_package_purchases ──────────────────────────────────────
-- The billing portal's purchase list. Joins package display fields the
-- caller can't read directly (packages is coach-only under RLS), and
-- includes soft-deleted packages so a purchase never loses its name.
CREATE OR REPLACE FUNCTION my_package_purchases()
RETURNS TABLE (
  id                 uuid,
  package_id         uuid,
  package_name       text,
  package_slug       text,
  billing_interval   text,
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
  SELECT pu.id, pu.package_id, p.name, p.slug, p.billing_interval,
         pu.kind, pu.status, pu.amount_cents, pu.currency,
         pu.current_period_end, pu.access_until, pu.paid_at, pu.created_at
  FROM package_purchases pu
  JOIN packages p ON p.id = pu.package_id
  WHERE pu.payer_profile_id = get_auth_profile_id()
     OR pu.athlete_profile_id = get_auth_profile_id()
  ORDER BY pu.created_at DESC
$$;

REVOKE ALL ON FUNCTION my_package_purchases() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_package_purchases() TO authenticated;
