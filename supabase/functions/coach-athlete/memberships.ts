// Coach-run membership changes for coach-athlete: start a package on the
// payer's saved card, cancel one, undo a pending cancel, or do a cancel and
// a start together (a package switch).
//
// A coach never sees or enters card details. A new package is only charged
// to a card the payer already saved in the billing portal; with none on
// file the start is refused. No refunds: cancelling "now" just stops access
// and billing.
//
// Dates are New Zealand calendar days. A start date in the future becomes
// package_purchases.starts_at (purchase_is_live() holds access back until
// then). A billing date in the future becomes the subscription's trial_end,
// which also anchors every later renewal on that day, or, for a one-off, a
// draft invoice Stripe finalizes and charges that day.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  accessUntil,
  dayToTimestamp,
  isIsoDate,
  MIN_CHARGE_CENTS,
  purchaseStatusForSubscription,
  zonedDate,
} from "../_shared/billingMath.ts";
import { json } from "../_shared/http.ts";
import {
  cardSummary,
  defaultPaymentMethod,
  ensurePrice,
  Stripe,
  stripe,
} from "../_shared/stripe.ts";

const CANCEL_REASON = "Cancelled by coach";
const DECLINE_HINT =
  "Ask them to update their card in the billing portal, then try again.";
/** Stripe caps trials at 730 days; keep well inside it. */
const MAX_DAYS_AHEAD = 365;

export type CancelWhen = "period_end" | "now";

type CancelRequest = { purchaseId: string; when: CancelWhen };
type AddRequest = {
  packageId: string;
  payerProfileId: string;
  startDate: string;
  billingDate: string;
};

type PurchaseRow = {
  id: string;
  athlete_profile_id: string;
  kind: "subscription" | "one_time";
  status: string;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  starts_at: string | null;
  paid_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type PackageRow = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_type: "recurring" | "one_time";
  billing_interval: "week" | "month" | "quarter" | "year" | null;
  access_weeks: number | null;
};

/** A failure that's reported to the coach rather than logged as a 500. */
class Refusal extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const unix = (d: Date) => Math.floor(d.getTime() / 1000);
const iso = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();

export function parseCancel(value: unknown): CancelRequest | null | false {
  if (value == null) return null;
  const v = value as Partial<CancelRequest>;
  if (typeof v.purchaseId !== "string") return false;
  if (v.when !== "period_end" && v.when !== "now") return false;
  return { purchaseId: v.purchaseId, when: v.when };
}

export function parseAdd(value: unknown): AddRequest | null | false {
  if (value == null) return null;
  const v = value as Partial<AddRequest>;
  if (
    typeof v.packageId !== "string" ||
    typeof v.payerProfileId !== "string" ||
    !isIsoDate(v.startDate) ||
    !isIsoDate(v.billingDate)
  ) {
    return false;
  }
  return {
    packageId: v.packageId,
    payerProfileId: v.payerProfileId,
    startDate: v.startDate,
    billingDate: v.billingDate,
  };
}

/** Cancel, add, or both. The add runs first because it's the step that can
 * fail on the card; if the cancel then fails, the new package stays and the
 * response says so (`partial`). */
export async function changeMembership(
  admin: SupabaseClient,
  athleteId: string,
  coachId: string,
  cancel: CancelRequest | null,
  add: AddRequest | null,
): Promise<{ response: Response; details: Record<string, unknown> }> {
  const details: Record<string, unknown> = { cancel, add };
  try {
    const old = cancel
      ? await loadPurchase(admin, athleteId, cancel.purchaseId)
      : null;
    if (old) checkCancellable(old, cancel!.when);

    let addedId: string | null = null;
    if (add) {
      // A switch's dates line up with the old package's renewal to the
      // second when they fall on its day.
      const anchor = old?.current_period_end
        ? new Date(old.current_period_end)
        : null;
      addedId = await addMembership(admin, athleteId, coachId, add, anchor);
      details.added_purchase_id = addedId;
    }

    if (old) {
      try {
        await cancelMembership(admin, old, cancel!.when, addedId);
      } catch (err) {
        if (!addedId) throw err;
        console.error("coach-athlete: cancel after add failed", err);
        details.partial = true;
        return {
          details,
          response: json(502, {
            ok: false,
            partial: true,
            error:
              "The new package was added, but cancelling the old one failed. Try cancelling it again.",
          }),
        };
      }
    }
    return { details, response: json(200, { ok: true }) };
  } catch (err) {
    if (err instanceof Refusal) {
      details.refused = err.message;
      return {
        details,
        response: json(err.status, { ok: false, error: err.message }),
      };
    }
    throw err;
  }
}

/** Undoes a pending end-of-period cancel. */
export async function keepMembership(
  admin: SupabaseClient,
  athleteId: string,
  purchaseId: string,
): Promise<Response> {
  try {
    const row = await loadPurchase(admin, athleteId, purchaseId);
    if (
      row.kind !== "subscription" ||
      !row.stripe_subscription_id ||
      !row.cancel_at_period_end ||
      row.status !== "active"
    ) {
      throw new Refusal(409, "This membership isn't set to cancel.");
    }
    await stripe.subscriptions.update(row.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    // Kept, so it no longer counts as switched: any package it was being
    // switched to stays, for the coach to cancel separately.
    await updatePurchase(admin, row.id, {
      cancel_at_period_end: false,
      cancel_reason: null,
      switched_to_purchase_id: null,
      switched_at: null,
    });
    return json(200, { ok: true });
  } catch (err) {
    if (err instanceof Refusal) {
      return json(err.status, { ok: false, error: err.message });
    }
    throw err;
  }
}

async function loadPurchase(
  admin: SupabaseClient,
  athleteId: string,
  purchaseId: string,
): Promise<PurchaseRow> {
  const { data, error } = await admin
    .from("package_purchases")
    .select(
      "id, athlete_profile_id, kind, status, stripe_subscription_id, stripe_invoice_id, starts_at, paid_at, current_period_end, cancel_at_period_end",
    )
    .eq("id", purchaseId)
    .maybeSingle<PurchaseRow>();
  if (error) throw new Error(error.message);
  if (!data || data.athlete_profile_id !== athleteId) {
    throw new Refusal(404, "Membership not found");
  }
  return data;
}

/** Hasn't started yet, so nothing has been used or (for a one-off) paid. */
function isScheduled(row: PurchaseRow): boolean {
  return !!row.starts_at && new Date(row.starts_at) > new Date();
}

function checkCancellable(row: PurchaseRow, when: CancelWhen) {
  if (row.status !== "active" && row.status !== "past_due") {
    throw new Refusal(409, "This membership has already ended.");
  }
  if (row.kind === "one_time") {
    if (!row.stripe_invoice_id || row.paid_at) {
      throw new Refusal(409, "A paid one-off package can't be cancelled.");
    }
    return;
  }
  if (!row.stripe_subscription_id) {
    throw new Refusal(409, "This membership can't be cancelled here.");
  }
  if (when === "period_end" && row.cancel_at_period_end) {
    throw new Refusal(409, "This membership is already set to cancel.");
  }
}

/** `switchedTo` is the purchase a switch added in this one's place. */
async function cancelMembership(
  admin: SupabaseClient,
  row: PurchaseRow,
  when: CancelWhen,
  switchedTo: string | null,
) {
  const switched = switchedTo
    ? {
        switched_to_purchase_id: switchedTo,
        switched_at: new Date().toISOString(),
      }
    : {};
  const endedNow = {
    status: "canceled",
    canceled_at: new Date().toISOString(),
    cancel_at_period_end: false,
    cancel_reason: CANCEL_REASON,
    ...switched,
  };

  if (row.kind === "one_time") {
    const invoice = await stripe.invoices.retrieve(row.stripe_invoice_id!);
    if (invoice.status === "paid") {
      throw new Refusal(409, "This package has already been charged.");
    }
    if (invoice.status === "draft") {
      // A deleted draft is gone from Stripe, so unlink it.
      await stripe.invoices.del(invoice.id!);
      await updatePurchase(admin, row.id, {
        ...endedNow,
        stripe_invoice_id: null,
      });
      return;
    }
    if (invoice.status === "open") {
      await stripe.invoices.voidInvoice(invoice.id!);
    }
    await updatePurchase(admin, row.id, endedNow);
    return;
  }

  const subId = row.stripe_subscription_id!;
  // A failed charge has no paid period left to run out, and a package that
  // hasn't started has nothing to finish, so both end now.
  if (when === "now" || row.status === "past_due" || isScheduled(row)) {
    await stripe.subscriptions.cancel(subId, {
      cancellation_details: { comment: CANCEL_REASON },
    });
    await updatePurchase(admin, row.id, endedNow);
    return;
  }
  await stripe.subscriptions.update(subId, {
    cancel_at_period_end: true,
    cancellation_details: { comment: CANCEL_REASON },
  });
  await updatePurchase(admin, row.id, {
    cancel_at_period_end: true,
    cancel_reason: CANCEL_REASON,
    ...switched,
  });
}

async function addMembership(
  admin: SupabaseClient,
  athleteId: string,
  coachId: string,
  add: AddRequest,
  anchor: Date | null,
): Promise<string> {
  const now = new Date();
  const today = zonedDate(now);
  const latest = zonedDate(
    new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000),
  );
  for (const date of [add.startDate, add.billingDate]) {
    if (date < today) throw new Refusal(400, "Dates can't be in the past.");
    if (date > latest) {
      throw new Refusal(400, "Dates must be within the next year.");
    }
  }

  if (add.payerProfileId !== athleteId) {
    const { data: link, error } = await admin
      .from("parent_player_links")
      .select("parent_profile_id")
      .eq("parent_profile_id", add.payerProfileId)
      .eq("player_profile_id", athleteId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!link) {
      throw new Refusal(403, "Only the athlete or their parent can pay.");
    }
  }

  const { data: pkg, error: pkgError } = await admin
    .from("packages")
    .select(
      "id, name, price_cents, currency, billing_type, billing_interval, access_weeks",
    )
    .eq("id", add.packageId)
    .is("deleted_at", null)
    .maybeSingle<PackageRow>();
  if (pkgError) throw new Error(pkgError.message);
  if (!pkg) throw new Refusal(404, "This package is no longer available.");
  if (pkg.price_cents < MIN_CHARGE_CENTS) {
    throw new Refusal(
      409,
      "This package's price is below Stripe's minimum charge. Update the price first.",
    );
  }

  const { data: customer, error: custError } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("profile_id", add.payerProfileId)
    .maybeSingle();
  if (custError) throw new Error(custError.message);
  const pm = customer
    ? await defaultPaymentMethod(customer.stripe_customer_id)
    : null;
  const card = pm ? cardSummary(pm) : null;
  if (!customer || !pm || !card) {
    throw new Refusal(409, "No card on file for this payer.");
  }
  if (card.expired) {
    throw new Refusal(409, `The card on file has expired. ${DECLINE_HINT}`);
  }

  const startsAt = dayToTimestamp(add.startDate, now, anchor);
  const billingAt = dayToTimestamp(add.billingDate, now, anchor);
  const kind = pkg.billing_type === "recurring" ? "subscription" : "one_time";

  // Claim first, like billing-checkout: the live-purchase unique index makes
  // a duplicate fail here instead of creating a second Stripe object.
  const { data: purchase, error: claimError } = await admin
    .from("package_purchases")
    .insert({
      package_id: pkg.id,
      payer_profile_id: add.payerProfileId,
      athlete_profile_id: athleteId,
      kind,
      status: "incomplete",
      amount_cents: pkg.price_cents,
      currency: pkg.currency,
      starts_at: startsAt?.toISOString() ?? null,
      billing_starts_at: billingAt?.toISOString() ?? null,
      created_by_coach: coachId,
    })
    .select("id")
    .single();
  if (claimError) {
    if (claimError.code === "23505") {
      throw new Refusal(
        409,
        "They already have this package, or a checkout for it is in progress.",
      );
    }
    throw new Error(claimError.message);
  }

  const metadata = {
    purchase_id: purchase.id,
    package_id: pkg.id,
    profile_id: add.payerProfileId,
    athlete_profile_id: athleteId,
    kind,
    created_by_coach: coachId,
  };
  const customerId = customer.stripe_customer_id;
  let invoiceId: string | null = null;
  // Set once Stripe has a live subscription or has taken the money, after
  // which the claim must never be released (see the catch below).
  let committed: Record<string, unknown> | null = null;

  try {
    const price = await ensurePrice(pkg);

    if (kind === "subscription") {
      const sub = await stripe.subscriptions.create(
        {
          customer: customerId,
          items: [{ price }],
          default_payment_method: pm.id,
          off_session: true,
          // A declined first charge throws instead of leaving an
          // incomplete subscription behind.
          payment_behavior: "error_if_incomplete",
          ...(billingAt ? { trial_end: unix(billingAt) } : {}),
          metadata,
        },
        { idempotencyKey: `hooper_sub_${purchase.id}` },
      );
      const status = purchaseStatusForSubscription(sub.status);
      if (status !== "active") {
        await stripe.subscriptions.cancel(sub.id);
        throw new Refusal(402, `The card was declined. ${DECLINE_HINT}`);
      }
      const periodEnd = Math.max(
        0,
        ...sub.items.data.map((i) => i.current_period_end ?? 0),
      );
      committed = {
        stripe_subscription_id: sub.id,
        status,
        current_period_end: periodEnd ? iso(periodEnd) : null,
        paid_at: billingAt ? null : now.toISOString(),
      };
      await updatePurchase(admin, purchase.id, committed);
      return purchase.id;
    }

    // One-off: an invoice for the package, charged to the saved card now or
    // finalized (and so charged) by Stripe on the billing day.
    const invoice = await stripe.invoices.create(
      {
        customer: customerId,
        collection_method: "charge_automatically",
        // No invoice-level card: it falls back to the customer's default,
        // so a card replaced in the portal before the billing day is used.
        pending_invoice_items_behavior: "exclude",
        auto_advance: !!billingAt,
        ...(billingAt ? { automatically_finalizes_at: unix(billingAt) } : {}),
        description: pkg.name,
        metadata,
      },
      { idempotencyKey: `hooper_inv_${purchase.id}` },
    );
    invoiceId = invoice.id!;
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        invoice: invoiceId,
        pricing: { price },
        metadata,
      },
      { idempotencyKey: `hooper_ii_${purchase.id}` },
    );
    // Link the invoice before charging so the webhook can find the row.
    // Access runs from the start date whether or not it's paid yet, the
    // same as a subscription's trial.
    const until = accessUntil(startsAt ?? now, pkg.access_weeks);
    await updatePurchase(admin, purchase.id, {
      stripe_invoice_id: invoiceId,
      status: "active",
      access_until: until ? until.toISOString() : null,
    });

    if (!billingAt) {
      await stripe.invoices.finalizeInvoice(invoiceId, { auto_advance: false });
      const paid = await stripe.invoices.pay(invoiceId, { off_session: true });
      if (paid.status !== "paid") {
        throw new Refusal(402, `The card was declined. ${DECLINE_HINT}`);
      }
      committed = {
        stripe_invoice_id: invoiceId,
        status: "active",
        paid_at: now.toISOString(),
      };
      await updatePurchase(admin, purchase.id, committed);
    }
    return purchase.id;
  } catch (err) {
    if (committed) {
      // Stripe already holds a live subscription or the payment, so keep the
      // claim (and its idempotency keys) rather than inviting a second
      // charge on retry. Best-effort record it again: a one-off's invoice is
      // already linked so invoice.paid can finish it, but the webhook only
      // finds a subscription by the id written here.
      console.error("coach-athlete: purchase update after charge failed", err);
      try {
        await updatePurchase(admin, purchase.id, committed);
      } catch (retryErr) {
        console.error("coach-athlete: couldn't record charge", retryErr);
      }
      throw err;
    }
    if (invoiceId) await discardInvoice(invoiceId);
    // Release the claim so the coach can try again.
    await admin.from("package_purchases").delete().eq("id", purchase.id);
    if (err instanceof Stripe.errors.StripeCardError) {
      throw new Refusal(402, `${err.message} ${DECLINE_HINT}`);
    }
    throw err;
  }
}

async function discardInvoice(invoiceId: string) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status === "draft") await stripe.invoices.del(invoiceId);
    else if (invoice.status === "open") {
      await stripe.invoices.voidInvoice(invoiceId);
    }
  } catch (err) {
    console.error("coach-athlete: couldn't discard invoice", invoiceId, err);
  }
}

async function updatePurchase(
  admin: SupabaseClient,
  purchaseId: string,
  update: Record<string, unknown>,
) {
  const { error } = await admin
    .from("package_purchases")
    .update(update)
    .eq("id", purchaseId);
  if (error) throw new Error(error.message);
}
