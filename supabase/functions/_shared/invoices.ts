// Stripe invoice listing and failed-charge retry, shared by the billing
// portal (billing-invoices, the payer's own) and the coach portal
// (coach-athlete, one athlete's).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { purchaseStatusForSubscription } from "./billingMath.ts";
import { json } from "./http.ts";
import { Stripe, stripe } from "./stripe.ts";

export type InvoiceRow = {
  id: string;
  /** Stripe's invoice number, or null for a one-off payment receipt. */
  number: string | null;
  description: string;
  /** ISO date the charge was made (or attempted). */
  date: string;
  /** The package_purchases row it was charged for, when Stripe carries it. */
  purchaseId: string | null;
  amountCents: number;
  currency: string;
  status: "paid" | "failed" | "due";
  url: string | null;
};

type PurchaseLabel = { package: string; athlete: string | null };

export async function listInvoices(
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
  return invoiceRows(admin, invoices.data, intents.data, callerId);
}

export type PurchaseRef = {
  stripe_subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  /** A coach-started one-off, charged by invoice. */
  stripe_invoice_id?: string | null;
};

/** One athlete's charges, fetched per purchase rather than from the payer's
 * Customer: a parent's Customer also carries their other children's
 * charges, which would crowd this athlete's out of a page. */
export async function listPurchaseInvoices(
  admin: SupabaseClient,
  purchases: PurchaseRef[],
  callerId: string,
): Promise<InvoiceRow[]> {
  const subIds = purchases
    .map((p) => p.stripe_subscription_id)
    .filter((id): id is string => !!id);
  const intentIds = purchases
    .map((p) => p.stripe_payment_intent_id)
    .filter((id): id is string => !!id);
  const invoiceIds = purchases
    .map((p) => p.stripe_invoice_id)
    .filter((id): id is string => !!id);
  const [invoices, oneOffInvoices, intents] = await Promise.all([
    Promise.all(
      subIds.map((subscription) =>
        stripe.invoices
          .list({ subscription, limit: 100 })
          .autoPagingToArray({ limit: 1000 }),
      ),
    ),
    Promise.all(invoiceIds.map(retrieveInvoice)),
    Promise.all(
      intentIds.map((id) =>
        stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] }),
      ),
    ),
  ]);
  return invoiceRows(
    admin,
    [
      ...invoices.flat(),
      ...oneOffInvoices.filter((i): i is Stripe.Invoice => !!i),
    ],
    intents,
    callerId,
  );
}

/** A one-off's invoice, or null if it's gone: a cancelled scheduled
 * one-off deletes its draft. */
async function retrieveInvoice(id: string): Promise<Stripe.Invoice | null> {
  try {
    return await stripe.invoices.retrieve(id);
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    return null;
  }
}

/** The purchase an invoice was charged for: a subscription's carries it on
 * the subscription, a coach-started one-off on the invoice itself. */
function invoicePurchaseId(i: Stripe.Invoice): string | undefined {
  return (
    i.parent?.subscription_details?.metadata?.purchase_id ??
    i.metadata?.purchase_id
  );
}

async function invoiceRows(
  admin: SupabaseClient,
  invoices: Stripe.Invoice[],
  intents: Stripe.PaymentIntent[],
  callerId: string,
): Promise<InvoiceRow[]> {
  const subInvoices = invoices.filter(
    (i) => i.status !== "draft" && i.status !== "void" && i.total > 0,
  );
  const oneOffs = intents.filter(
    (pi) => pi.metadata?.kind === "one_time" && pi.status === "succeeded",
  );

  const purchaseIds = [
    ...subInvoices.map(invoicePurchaseId),
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
  const purchaseId = invoicePurchaseId(i);
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
    purchaseId: purchaseId ?? null,
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
    purchaseId: pi.metadata.purchase_id ?? null,
    amountCents: pi.amount_received || pi.amount,
    currency: pi.currency,
    status: "paid",
    url: charge?.receipt_url ?? null,
  };
}

type RetryPurchase = {
  payer_profile_id: string;
  athlete_profile_id: string;
};

/** Retries a past_due membership's unpaid invoice, then syncs the row so
 * the portal updates without waiting for the webhook. `allowed` decides who
 * may retry it (the payer in the billing portal, any coach for that athlete
 * in the coach portal); `declineHint` follows the bank's message on a
 * decline. `invoiceId` charges that invoice — it must belong to this
 * membership — rather than the subscription's latest one. */
export async function retryMembership(
  admin: SupabaseClient,
  purchaseId: string,
  allowed: (row: RetryPurchase) => boolean,
  declineHint: string,
  invoiceId?: string,
) {
  const { data: row, error } = await admin
    .from("package_purchases")
    .select(
      "id, payer_profile_id, athlete_profile_id, status, stripe_subscription_id, stripe_invoice_id",
    )
    .eq("id", purchaseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (
    !row ||
    !allowed(row) ||
    (!row.stripe_subscription_id && !row.stripe_invoice_id)
  ) {
    return json(404, { ok: false, error: "Membership not found" });
  }
  if (row.status !== "past_due") {
    return json(409, {
      ok: false,
      error: "Nothing is owing on this membership.",
    });
  }

  if (!row.stripe_subscription_id) {
    return retryOneOffInvoice(
      admin,
      row.id,
      row.stripe_invoice_id,
      declineHint,
      invoiceId,
    );
  }

  const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
  const targetId =
    invoiceId ??
    (typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : sub.latest_invoice?.id);
  if (!targetId) {
    return json(409, { ok: false, error: "No unpaid invoice found." });
  }

  const invoice = await stripe.invoices.retrieve(targetId);
  const invoiceSub = invoice.parent?.subscription_details?.subscription;
  const invoiceSubId =
    typeof invoiceSub === "string" ? invoiceSub : invoiceSub?.id;
  if (invoiceSubId !== sub.id) {
    return json(404, { ok: false, error: "Invoice not found" });
  }
  if (invoice.status === "void" || invoice.status === "draft") {
    return json(409, {
      ok: false,
      error: "This invoice can't be charged.",
    });
  }

  // Stripe's own retry may already have collected it (and the webhook not
  // landed yet) — then there's nothing to charge, just resync the row.
  if (invoice.status !== "paid") {
    try {
      await stripe.invoices.pay(targetId);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeCardError) {
        return json(402, {
          ok: false,
          error: `${err.message} ${declineHint}`,
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

/** A coach-started one-off is a single invoice: charge it again, then mark
 * the purchase paid without waiting for the webhook. */
async function retryOneOffInvoice(
  admin: SupabaseClient,
  purchaseId: string,
  ownInvoiceId: string,
  declineHint: string,
  invoiceId?: string,
) {
  if (invoiceId && invoiceId !== ownInvoiceId) {
    return json(404, { ok: false, error: "Invoice not found" });
  }
  const invoice = await stripe.invoices.retrieve(ownInvoiceId);
  if (invoice.status === "void" || invoice.status === "draft") {
    return json(409, { ok: false, error: "This invoice can't be charged." });
  }
  if (invoice.status !== "paid") {
    try {
      await stripe.invoices.pay(ownInvoiceId, { off_session: true });
    } catch (err) {
      if (err instanceof Stripe.errors.StripeCardError) {
        return json(402, { ok: false, error: `${err.message} ${declineHint}` });
      }
      throw err;
    }
  }
  const { error } = await admin
    .from("package_purchases")
    .update({ status: "active", paid_at: new Date().toISOString() })
    .eq("id", purchaseId)
    .eq("status", "past_due");
  if (error) throw new Error(error.message);
  return json(200, { ok: true, status: "active" });
}
