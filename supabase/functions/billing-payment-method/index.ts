// Deploy: supabase functions deploy billing-payment-method
//
// Authenticated. The billing portal's card-on-file endpoint:
//   { action: "get" }                          → { card | null }
//   { action: "create_setup_intent" }          → { clientSecret }
//   { action: "set_default", paymentMethodId } → { card }
// "Default" lives in two places in Stripe — the Customer's
// invoice_settings (used for new subscriptions/one-off charges) and each
// subscription's own default_payment_method (set by checkout's
// save_default_payment_method) — so set_default updates both.
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import {
  cardSummary,
  ensureCustomer,
  Stripe,
  stripe,
} from "../_shared/stripe.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let body: { action?: unknown; paymentMethodId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }

    if (body.action === "get") {
      const { data: row, error } = await admin
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq("profile_id", caller.profileId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return json(200, { ok: true, card: null });
      const pm = await defaultPaymentMethod(row.stripe_customer_id);
      return json(200, { ok: true, card: pm ? cardSummary(pm) : null });
    }

    const customer = await ensureCustomer(admin, caller);

    if (body.action === "create_setup_intent") {
      const si = await stripe.setupIntents.create({
        customer,
        usage: "off_session",
        payment_method_types: ["card"],
        metadata: { profile_id: caller.profileId },
      });
      return json(200, { ok: true, clientSecret: si.client_secret });
    }

    if (body.action === "set_default") {
      if (typeof body.paymentMethodId !== "string") {
        return json(400, { ok: false, error: "Missing payment method" });
      }
      const pm = await stripe.paymentMethods.retrieve(body.paymentMethodId);
      const owner =
        typeof pm.customer === "string" ? pm.customer : pm.customer?.id;
      if (owner !== customer) {
        return json(403, { ok: false, error: "Unknown payment method" });
      }

      await stripe.customers.update(customer, {
        invoice_settings: { default_payment_method: pm.id },
      });
      const subs = await stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      });
      await Promise.all(
        subs.data
          .filter((s) =>
            ["active", "past_due", "trialing", "unpaid"].includes(s.status),
          )
          .map((s) =>
            stripe.subscriptions.update(s.id, {
              default_payment_method: pm.id,
            }),
          ),
      );
      return json(200, { ok: true, card: cardSummary(pm) });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("billing-payment-method: unhandled error", err);
    return json(500, { ok: false, error: "Unable to load payment details." });
  }
});

/** The Customer's invoice default, falling back to the most recently added
 * card (a subscription-only checkout saves the card on the subscription,
 * not the Customer). */
async function defaultPaymentMethod(
  customerId: string,
): Promise<Stripe.PaymentMethod | null> {
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ["invoice_settings.default_payment_method"],
  });
  if (!customer.deleted) {
    const pm = customer.invoice_settings?.default_payment_method;
    if (pm && typeof pm !== "string") return pm;
  }
  const cards = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });
  return cards.data[0] ?? null;
}
