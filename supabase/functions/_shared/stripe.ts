// The one place Hooper creates Stripe objects. Everything goes to the single
// Hooper platform account today; when coaches get Stripe Connect accounts,
// the routing (transfer_data / on_behalf_of / application fee) is added
// here rather than in each function.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.5.0";
import { type PackagePriceFields, priceSpecFor } from "./billingMath.ts";
import type { Caller } from "./http.ts";

export { Stripe };

// stripe@18.5.0 pins API version 2025-08-27.basil. Code below relies on
// basil shapes: invoice.confirmation_secret (not invoice.payment_intent),
// invoice.parent.subscription_details, and per-item current_period_end.
export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function ensureCustomer(
  admin: SupabaseClient,
  caller: Caller,
): Promise<string> {
  const { data: existing, error } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("profile_id", caller.profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return existing.stripe_customer_id;

  const name = [caller.firstName, caller.lastName].filter(Boolean).join(" ");
  // Idempotency key keeps two racing first checkouts on one Customer.
  const customer = await stripe.customers.create(
    {
      email: caller.email ?? undefined,
      name: name || undefined,
      metadata: { profile_id: caller.profileId },
    },
    { idempotencyKey: `hooper_customer_${caller.profileId}` },
  );

  const { error: insertError } = await admin
    .from("billing_customers")
    .upsert(
      { profile_id: caller.profileId, stripe_customer_id: customer.id },
      { onConflict: "profile_id", ignoreDuplicates: true },
    );
  if (insertError) throw new Error(insertError.message);
  return customer.id;
}

export async function ensurePrice(
  pkg: PackagePriceFields & { name: string },
): Promise<string> {
  const spec = priceSpecFor(pkg);

  const found = await stripe.prices.list({
    lookup_keys: [spec.lookupKey],
    active: true,
    limit: 1,
  });
  if (found.data[0]) return found.data[0].id;

  try {
    await stripe.products.retrieve(spec.productId);
    await stripe.products.update(spec.productId, { name: pkg.name });
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    await stripe.products.create({
      id: spec.productId,
      name: pkg.name,
      metadata: { package_id: pkg.id },
    });
  }

  const price = await stripe.prices.create(
    {
      product: spec.productId,
      unit_amount: spec.unitAmount,
      currency: spec.currency,
      lookup_key: spec.lookupKey,
      ...(spec.recurring ? { recurring: spec.recurring } : {}),
      metadata: { package_id: pkg.id },
    },
    { idempotencyKey: `hooper_price_${spec.lookupKey}` },
  );
  return price.id;
}

/** Client secret for the first invoice of a default_incomplete subscription. */
export function subscriptionClientSecret(
  sub: Stripe.Subscription,
): string | null {
  const invoice = sub.latest_invoice;
  if (!invoice || typeof invoice === "string") return null;
  return invoice.confirmation_secret?.client_secret ?? null;
}

export type CardSummary = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  expired: boolean;
};

export function cardSummary(pm: Stripe.PaymentMethod): CardSummary | null {
  if (!pm.card) return null;
  const now = new Date();
  const { exp_month, exp_year } = pm.card;
  // A card is valid through the end of its expiry month.
  const expired =
    exp_year < now.getFullYear() ||
    (exp_year === now.getFullYear() && exp_month < now.getMonth() + 1);
  return {
    id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    exp_month,
    exp_year,
    expired,
  };
}
