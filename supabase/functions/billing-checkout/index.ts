// Deploy: supabase functions deploy billing-checkout
//
// Authenticated. Starts (or resumes) a package purchase for the caller and
// returns a Stripe client secret for the billing portal's Payment Element.
//   recurring package → Subscription (default_incomplete); the secret pays
//                       its first invoice and saves the card on the sub.
//   one_time package  → PaymentIntent with setup_future_usage so the card
//                       is kept on the Customer for the Account tab.
// The purchase row is claimed BEFORE creating the Stripe object: the
// partial unique index on live purchases makes a concurrent second request
// fail fast instead of creating a duplicate subscription.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminClient,
  type Caller,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import {
  ensureCustomer,
  ensurePrice,
  Stripe,
  stripe,
  subscriptionClientSecret,
} from "../_shared/stripe.ts";

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_type: "recurring" | "one_time";
  billing_interval: "week" | "month" | "quarter" | "year" | null;
  access_weeks: number | null;
};

type PurchaseRow = {
  id: string;
  kind: "subscription" | "one_time";
  status: string;
  amount_cents: number;
  stripe_subscription_id: string | null;
  stripe_payment_intent_id: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let slug: unknown;
    try {
      ({ slug } = await req.json());
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }
    if (typeof slug !== "string" || !slug) {
      return json(400, { ok: false, error: "Missing package" });
    }

    const { data: pkg, error: pkgError } = await admin
      .from("packages")
      .select(
        "id, slug, name, price_cents, currency, billing_type, billing_interval, access_weeks",
      )
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle<PackageRow>();
    if (pkgError) throw new Error(pkgError.message);
    if (!pkg) {
      return json(404, {
        ok: false,
        code: "not_found",
        error: "This package is no longer available.",
      });
    }

    const { data: live, error: liveError } = await admin
      .from("package_purchases")
      .select(
        "id, kind, status, amount_cents, stripe_subscription_id, stripe_payment_intent_id",
      )
      .eq("athlete_profile_id", caller.profileId)
      .eq("package_id", pkg.id)
      .in("status", ["incomplete", "active", "past_due"])
      .maybeSingle<PurchaseRow>();
    if (liveError) throw new Error(liveError.message);

    if (live && live.status !== "incomplete") {
      return json(200, {
        ok: true,
        status: "already_owned",
        purchaseId: live.id,
      });
    }

    if (live) {
      const resumed = await resume(admin, live, pkg);
      if (resumed) return json(200, resumed);
    }

    return json(200, await start(admin, caller, pkg));
  } catch (err) {
    console.error("billing-checkout: unhandled error", err);
    return json(500, { ok: false, error: "Unable to start checkout." });
  }
});

/** Picks an abandoned 'incomplete' attempt back up if its Stripe object can
 * still be paid at the current price. Otherwise cancels it, marks the row
 * expired (freeing the unique slot) and returns null so a fresh one starts. */
async function resume(
  admin: SupabaseClient,
  live: PurchaseRow,
  pkg: PackageRow,
) {
  const base = {
    ok: true,
    purchaseId: live.id,
    amountCents: live.amount_cents,
    currency: pkg.currency,
  };
  const samePrice = live.amount_cents === pkg.price_cents;

  if (live.stripe_subscription_id) {
    const sub = await stripe.subscriptions.retrieve(
      live.stripe_subscription_id,
      { expand: ["latest_invoice.confirmation_secret"] },
    );
    const secret = subscriptionClientSecret(sub);
    if (sub.status === "incomplete" && secret && samePrice) {
      return {
        ...base,
        status: "requires_payment",
        mode: "subscription",
        clientSecret: secret,
      };
    }
    if (sub.status === "active" || sub.status === "trialing") {
      // Paid, webhook not processed yet.
      return { ...base, status: "processing" };
    }
    if (sub.status === "incomplete") {
      await stripe.subscriptions.cancel(sub.id);
    }
  } else if (live.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(
      live.stripe_payment_intent_id,
    );
    const payable = [
      "requires_payment_method",
      "requires_confirmation",
      "requires_action",
    ].includes(pi.status);
    if (payable && samePrice) {
      return {
        ...base,
        status: "requires_payment",
        mode: "payment",
        clientSecret: pi.client_secret,
      };
    }
    if (pi.status === "succeeded" || pi.status === "processing") {
      return { ...base, status: "processing" };
    }
    if (payable) await stripe.paymentIntents.cancel(pi.id);
  }

  const { error } = await admin
    .from("package_purchases")
    .update({ status: "expired" })
    .eq("id", live.id);
  if (error) throw new Error(error.message);
  return null;
}

async function start(admin: SupabaseClient, caller: Caller, pkg: PackageRow) {
  const kind = pkg.billing_type === "recurring" ? "subscription" : "one_time";

  const { data: purchase, error: claimError } = await admin
    .from("package_purchases")
    .insert({
      package_id: pkg.id,
      payer_profile_id: caller.profileId,
      athlete_profile_id: caller.profileId,
      kind,
      status: "incomplete",
      amount_cents: pkg.price_cents,
      currency: pkg.currency,
    })
    .select("id")
    .single();
  if (claimError) {
    // 23505: a concurrent request already claimed this package.
    if (claimError.code === "23505") {
      return {
        ok: false,
        code: "in_progress",
        error:
          "A checkout for this package is already in progress. Refresh to continue.",
      };
    }
    throw new Error(claimError.message);
  }

  const metadata = {
    purchase_id: purchase.id,
    package_id: pkg.id,
    profile_id: caller.profileId,
    kind,
  };

  try {
    const customer = await ensureCustomer(admin, caller);
    const price = await ensurePrice(pkg);

    if (kind === "subscription") {
      const sub: Stripe.Subscription = await stripe.subscriptions.create(
        {
          customer,
          items: [{ price }],
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription",
            payment_method_types: ["card"],
          },
          metadata,
          expand: ["latest_invoice.confirmation_secret"],
        },
        { idempotencyKey: `hooper_sub_${purchase.id}` },
      );
      await setStripeRef(admin, purchase.id, {
        stripe_subscription_id: sub.id,
      });
      return {
        ok: true,
        status: "requires_payment",
        mode: "subscription",
        purchaseId: purchase.id,
        clientSecret: subscriptionClientSecret(sub),
        amountCents: pkg.price_cents,
        currency: pkg.currency,
      };
    }

    const pi = await stripe.paymentIntents.create(
      {
        amount: pkg.price_cents,
        currency: pkg.currency,
        customer,
        setup_future_usage: "off_session",
        payment_method_types: ["card"],
        description: pkg.name,
        metadata,
      },
      { idempotencyKey: `hooper_pi_${purchase.id}` },
    );
    await setStripeRef(admin, purchase.id, {
      stripe_payment_intent_id: pi.id,
    });
    return {
      ok: true,
      status: "requires_payment",
      mode: "payment",
      purchaseId: purchase.id,
      clientSecret: pi.client_secret,
      amountCents: pkg.price_cents,
      currency: pkg.currency,
    };
  } catch (err) {
    // Release the claim so the user can retry.
    await admin.from("package_purchases").delete().eq("id", purchase.id);
    throw err;
  }
}

async function setStripeRef(
  admin: SupabaseClient,
  purchaseId: string,
  ref: { stripe_subscription_id?: string; stripe_payment_intent_id?: string },
) {
  const { error } = await admin
    .from("package_purchases")
    .update(ref)
    .eq("id", purchaseId);
  if (error) throw new Error(error.message);
}
