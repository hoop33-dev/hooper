// Deploy: supabase functions deploy billing-invoices
//
// Authenticated. The billing portal's invoices and failed-charge retry:
//   { action: "list" } → { invoices: InvoiceRow[] }
//     The caller's Stripe invoices (membership charges) and one-off package
//     payments, newest first, each with a link to Stripe's hosted invoice
//     or receipt. Rows are named after the package and who it's for.
//   { action: "pay", purchaseId } → { ok, status }
//     Retries a failed (past_due) membership's open invoice against the
//     card on file. A decline comes back as { ok: false, error } with the
//     bank's message. Only the purchase's payer can do this.
// Lists come from the caller's own Stripe Customer, so a child signed in
// to the portal (who doesn't pay) sees no invoices.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { purchaseStatusForSubscription } from "../_shared/billingMath.ts";
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import { Stripe, stripe } from "../_shared/stripe.ts";

type InvoiceRow = {
  id: string;
  /** Stripe's invoice number, or null for a one-off payment receipt. */
  number: string | null;
  description: string;
  /** ISO date the charge was made (or attempted). */
  date: string;
  amountCents: number;
  currency: string;
  status: "paid" | "failed" | "due";
  url: string | null;
};

type PurchaseLabel = { package: string; athlete: string | null };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let body: { action?: unknown; purchaseId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }

    if (body.action === "list") {
      const { data: row, error } = await admin
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq("profile_id", caller.profileId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return json(200, { ok: true, invoices: [] });
      const invoices = await listInvoices(
        admin,
        row.stripe_customer_id,
        caller.profileId,
      );
      return json(200, { ok: true, invoices });
    }

    if (body.action === "pay") {
      if (typeof body.purchaseId !== "string") {
        return json(400, { ok: false, error: "Missing membership" });
      }
      try {
        return await retry(admin, body.purchaseId, caller.profileId);
      } catch (err) {
        console.error("billing-invoices: retry failed", err);
        return json(500, {
          ok: false,
          error: "Couldn't retry the payment. Please try again.",
        });
      }
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("billing-invoices: unhandled error", err);
    return json(500, { ok: false, error: "Unable to load invoices." });
  }
});

async function listInvoices(
  admin: SupabaseClient,
  customer: string,
  callerId: string,
): Promise<InvoiceRow[]> {
  const [invoices, intents] = await Promise.all([
    stripe.invoices.list({ customer, limit: 50 }),
    stripe.paymentIntents.list({
      customer,
      limit: 50,
      expand: ["data.latest_charge"],
    }),
  ]);

  const subInvoices = invoices.data.filter(
    (i) => i.status !== "draft" && i.status !== "void" && i.total > 0,
  );
  const oneOffs = intents.data.filter(
    (pi) => pi.metadata?.kind === "one_time" && pi.status === "succeeded",
  );

  const purchaseIds = [
    ...subInvoices.map(
      (i) => i.parent?.subscription_details?.metadata?.purchase_id,
    ),
    ...oneOffs.map((pi) => pi.metadata.purchase_id),
  ].filter((id): id is string => typeof id === "string");
  const labels = await purchaseLabels(admin, purchaseIds, callerId);

  const rows: InvoiceRow[] = [
    ...subInvoices.map((i) => invoiceRow(i, labels)),
    ...oneOffs.map((pi) => receiptRow(pi, labels)),
  ];
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

/** "Joe's Test Package" for the caller's own, "Joe's Test Package — Liam"
 * for a child's. */
async function purchaseLabels(
  admin: SupabaseClient,
  ids: string[],
  callerId: string,
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (ids.length === 0) return labels;
  const { data, error } = await admin
    .from("package_purchases")
    .select(
      "id, athlete_profile_id, packages(name), athlete:profiles!package_purchases_athlete_profile_id_fkey(first_name)",
    )
    .in("id", [...new Set(ids)]);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const r = row as unknown as {
      id: string;
      athlete_profile_id: string;
      packages: { name: string } | null;
      athlete: { first_name: string | null } | null;
    };
    const label: PurchaseLabel = {
      package: r.packages?.name ?? "Package",
      athlete:
        r.athlete_profile_id === callerId
          ? null
          : (r.athlete?.first_name ?? null),
    };
    labels.set(
      r.id,
      label.athlete ? `${label.package} — ${label.athlete}` : label.package,
    );
  }
  return labels;
}

function toIso(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

function invoiceRow(
  i: Stripe.Invoice,
  labels: Map<string, string>,
): InvoiceRow {
  const purchaseId = i.parent?.subscription_details?.metadata?.purchase_id;
  const status: InvoiceRow["status"] =
    i.status === "paid"
      ? "paid"
      : i.status === "uncollectible" || (i.attempt_count ?? 0) > 0
        ? "failed"
        : "due";
  return {
    id: i.id!,
    number: i.number ?? null,
    description:
      (purchaseId && labels.get(purchaseId)) ||
      i.lines.data[0]?.description ||
      "Membership",
    date: toIso(i.status_transitions?.paid_at ?? i.created),
    amountCents: i.total,
    currency: i.currency,
    status,
    url: i.hosted_invoice_url ?? i.invoice_pdf ?? null,
  };
}

function receiptRow(
  pi: Stripe.PaymentIntent,
  labels: Map<string, string>,
): InvoiceRow {
  const charge =
    pi.latest_charge && typeof pi.latest_charge !== "string"
      ? pi.latest_charge
      : null;
  return {
    id: pi.id,
    number: null,
    description: labels.get(pi.metadata.purchase_id) ?? "Package",
    date: toIso(charge?.created ?? pi.created),
    amountCents: pi.amount_received || pi.amount,
    currency: pi.currency,
    status: "paid",
    url: charge?.receipt_url ?? null,
  };
}

/** Retries a past_due membership's open invoice, then syncs the row so the
 * portal updates without waiting for the webhook. */
async function retry(
  admin: SupabaseClient,
  purchaseId: string,
  callerId: string,
) {
  const { data: row, error } = await admin
    .from("package_purchases")
    .select("id, payer_profile_id, status, stripe_subscription_id")
    .eq("id", purchaseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (
    !row ||
    row.payer_profile_id !== callerId ||
    !row.stripe_subscription_id
  ) {
    return json(404, { ok: false, error: "Membership not found" });
  }
  if (row.status !== "past_due") {
    return json(409, {
      ok: false,
      error: "Nothing is owing on this membership.",
    });
  }

  const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
  const invoiceId =
    typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : sub.latest_invoice?.id;
  if (!invoiceId) {
    return json(409, { ok: false, error: "No unpaid invoice found." });
  }

  // Stripe's own retry may already have collected it (and the webhook not
  // landed yet) — then there's nothing to charge, just resync the row.
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (invoice.status !== "paid") {
    try {
      await stripe.invoices.pay(invoiceId);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeCardError) {
        return json(402, {
          ok: false,
          error: `${err.message} Update your card on the Account page and try again.`,
        });
      }
      throw err;
    }
  }

  const fresh = await stripe.subscriptions.retrieve(sub.id);
  const periodEnd = Math.max(
    0,
    ...fresh.items.data.map((i) => i.current_period_end ?? 0),
  );
  const status = purchaseStatusForSubscription(fresh.status);
  const { error: updateError } = await admin
    .from("package_purchases")
    .update({
      status,
      ...(periodEnd ? { current_period_end: toIso(periodEnd) } : {}),
    })
    .eq("id", row.id)
    .eq("status", "past_due");
  if (updateError) throw new Error(updateError.message);
  return json(200, { ok: true, status });
}
