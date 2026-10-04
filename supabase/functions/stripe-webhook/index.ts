// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
//
// Public endpoint called by Stripe; authenticity comes from the
// Stripe-Signature header (STRIPE_WEBHOOK_SECRET), not a Supabase JWT.
// Keeps package_purchases in sync with Stripe. Every handler is written as
// an idempotent "set the row to match Stripe", so retries and out-of-order
// delivery are harmless.
//
// Subscribe the endpoint to: invoice.paid, invoice.payment_failed,
// customer.subscription.updated, customer.subscription.deleted,
// payment_intent.succeeded.
//
// API versions: Stripe renders event payloads in the *endpoint's* API version
// (whatever the dashboard offered when it was created), while our SDK pins
// its own version (see _shared/stripe.ts). So handlers never read
// event.data.object's fields — they take only its id and re-fetch the object
// through the pinned SDK, which keeps the shapes the code relies on
// regardless of the endpoint's version. Re-fetching also means a delayed or
// out-of-order event always acts on Stripe's current state.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  accessUntil,
  purchaseStatusForSubscription,
} from "../_shared/billingMath.ts";
import { adminClient, json } from "../_shared/http.ts";
import { Stripe, stripe } from "../_shared/stripe.ts";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return json(400, { ok: false, error: "Missing signature" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("stripe-webhook: bad signature", (err as Error).message);
    return json(400, { ok: false, error: "Invalid signature" });
  }

  try {
    const admin = adminClient();
    const objectId = (event.data.object as { id?: string }).id;
    if (!objectId) return json(200, { ok: true });

    switch (event.type) {
      case "invoice.paid":
        await onInvoicePaid(admin, await stripe.invoices.retrieve(objectId));
        break;
      case "invoice.payment_failed":
        await onInvoiceFailed(admin, await stripe.invoices.retrieve(objectId));
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await onSubscriptionChanged(
          admin,
          await stripe.subscriptions.retrieve(objectId),
        );
        break;
      case "payment_intent.succeeded":
        await onPaymentIntentSucceeded(
          admin,
          await stripe.paymentIntents.retrieve(objectId),
        );
        break;
    }
    return json(200, { ok: true });
  } catch (err) {
    // Non-2xx makes Stripe retry with backoff.
    console.error(`stripe-webhook: ${event.type} failed`, err);
    return json(500, { ok: false });
  }
});

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function toIso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

async function onInvoicePaid(admin: SupabaseClient, invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId || invoice.status !== "paid") return;
  const periodEnd = Math.max(
    0,
    ...invoice.lines.data.map((l) => l.period?.end ?? 0),
  );
  const paidAt =
    toIso(invoice.status_transitions?.paid_at) ?? new Date().toISOString();

  const { data: row, error: readError } = await admin
    .from("package_purchases")
    .select("id, paid_at")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!row) {
    console.warn(`stripe-webhook: no purchase for subscription ${subId}`);
    return;
  }

  const { error } = await admin
    .from("package_purchases")
    .update({
      status: "active",
      current_period_end: toIso(periodEnd),
      paid_at: row.paid_at ?? paidAt,
    })
    .eq("id", row.id)
    // Never resurrect a cancelled purchase from a late invoice event.
    .not("status", "in", "(canceled,expired)");
  if (error) throw new Error(error.message);
}

async function onInvoiceFailed(admin: SupabaseClient, invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  // Only a renewal failure moves to past_due; a failed first payment stays
  // incomplete (the user sees the decline inline and can retry).
  const { error } = await admin
    .from("package_purchases")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
}

async function onSubscriptionChanged(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
) {
  const status = purchaseStatusForSubscription(sub.status);
  const periodEnd = Math.max(
    0,
    ...sub.items.data.map((i) => i.current_period_end ?? 0),
  );
  const update: Record<string, unknown> = {
    status,
    current_period_end: toIso(periodEnd),
  };
  if (status === "canceled") {
    update.canceled_at = toIso(sub.canceled_at) ?? new Date().toISOString();
  }

  let query = admin
    .from("package_purchases")
    .update(update)
    .eq("stripe_subscription_id", sub.id);
  // An 'incomplete' subscription event can arrive after invoice.paid has
  // already activated the row — don't step it backwards.
  if (status === "incomplete") query = query.eq("status", "incomplete");
  const { error } = await query;
  if (error) throw new Error(error.message);
}

async function onPaymentIntentSucceeded(
  admin: SupabaseClient,
  pi: Stripe.PaymentIntent,
) {
  // Subscription invoices also produce PaymentIntents; those are handled by
  // invoice.paid. Only one-off package payments carry our purchase metadata.
  if (pi.metadata?.kind !== "one_time" || pi.status !== "succeeded") return;

  const { data: row, error: readError } = await admin
    .from("package_purchases")
    .select("id, status, package_id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!row) {
    console.warn(`stripe-webhook: no purchase for payment intent ${pi.id}`);
    return;
  }
  if (row.status === "active") return; // already processed

  const { data: pkg, error: pkgError } = await admin
    .from("packages")
    .select("access_weeks")
    .eq("id", row.package_id)
    .single();
  if (pkgError) throw new Error(pkgError.message);

  const paidAt = new Date();
  const until = accessUntil(paidAt, pkg.access_weeks);

  const { error } = await admin
    .from("package_purchases")
    .update({
      status: "active",
      paid_at: paidAt.toISOString(),
      access_until: until ? until.toISOString() : null,
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);

  // Make the saved card the Customer's default if they don't have one, so
  // the Account tab and future purchases pick it up.
  const customerId =
    typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
  const pmId =
    typeof pi.payment_method === "string"
      ? pi.payment_method
      : pi.payment_method?.id;
  if (customerId && pmId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (
      !customer.deleted &&
      !customer.invoice_settings?.default_payment_method
    ) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pmId },
      });
    }
  }
}
