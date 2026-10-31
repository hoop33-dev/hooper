import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { invokeFunction } from "@/src/services/_invoke";
import type { MyPackagePurchase } from "@hooper/db";
import { cache } from "react";

/** Stripe work happens in Supabase edge functions (they hold the Stripe
 * secret and service-role keys). These wrappers invoke them with the signed-in
 * user's session JWT. */

/** Who the purchase is for — the caller, or one of their children. */
type CheckoutFor = {
  athleteProfileId: string;
  athleteFirstName: string | null;
};

export type CheckoutStart = CheckoutFor &
  (
    | {
        status: "requires_payment";
        mode: "subscription" | "payment";
        purchaseId: string;
        clientSecret: string;
        amountCents: number;
        currency: string;
      }
    | { status: "processing"; purchaseId: string }
    | { status: "already_owned"; purchaseId: string }
  );

export type CheckoutError = {
  code?: "not_found" | "in_progress" | "unavailable";
  message: string;
};

export type CardSummary = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  expired: boolean;
};

type FnResponse = { ok: boolean };

/** invokeFunction narrowed to the service-layer Result shape. */
async function invoke<T extends FnResponse>(
  name: string,
  body: Record<string, unknown>,
): Promise<Result<T>> {
  const res = await invokeFunction<T>(name, body);
  return res.ok ? ok(res.data) : err(res.error);
}

/** Starts or resumes checkout. `athleteProfileId` buys for a child the
 * caller manages; omit it to buy for yourself. */
export async function startCheckout(
  slug: string,
  athleteProfileId?: string,
): Promise<
  { ok: true; data: CheckoutStart } | { ok: false; error: CheckoutError }
> {
  const res = await invokeFunction<CheckoutStart>("billing-checkout", {
    slug,
    ...(athleteProfileId ? { athleteProfileId } : {}),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: {
        code:
          res.code === "not_found" ||
          res.code === "in_progress" ||
          res.code === "unavailable"
            ? res.code
            : undefined,
        message: res.error,
      },
    };
  }
  return { ok: true, data: res.data };
}

export async function getPaymentMethod(): Promise<Result<CardSummary | null>> {
  const res = await invoke<FnResponse & { card: CardSummary | null }>(
    "billing-payment-method",
    { action: "get" },
  );
  if (!res.ok) return res;
  return ok(res.data.card);
}

export async function createSetupIntent(): Promise<Result<string>> {
  const res = await invoke<FnResponse & { clientSecret: string }>(
    "billing-payment-method",
    { action: "create_setup_intent" },
  );
  if (!res.ok) return res;
  return ok(res.data.clientSecret);
}

export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<Result<CardSummary | null>> {
  const res = await invoke<FnResponse & { card: CardSummary | null }>(
    "billing-payment-method",
    { action: "set_default", paymentMethodId },
  );
  if (!res.ok) return res;
  return ok(res.data.card);
}

/** After a card-update redirect (3DS), make the SetupIntent's card the
 * default — the client never got to run setDefaultPaymentMethod. */
export async function completeSetupIntent(
  setupIntentId: string,
): Promise<Result<CardSummary | null>> {
  const res = await invoke<FnResponse & { card: CardSummary | null }>(
    "billing-payment-method",
    { action: "complete_setup", setupIntentId },
  );
  if (!res.ok) return res;
  return ok(res.data.card);
}

/** Everything the caller pays for or receives. Cached per request: the
 * portal layout (nav badge) and the page both read it. */
export const getMyPurchases = cache(
  async (): Promise<Result<MyPackagePurchase[]>> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("my_package_purchases");
    if (error) return err(error.message);
    return ok(data ?? []);
  },
);

/** Stops a monthly membership the caller pays for. Active ones run to the
 * end of the paid period; a failed (past_due) one ends now. */
export async function cancelMembership(
  purchaseId: string,
  reason: string | null,
): Promise<Result<null>> {
  const res = await invoke<FnResponse>("billing-membership", {
    action: "cancel",
    purchaseId,
    ...(reason ? { reason } : {}),
  });
  return res.ok ? ok(null) : res;
}

/** Undoes a pending end-of-period cancel. */
export async function keepMembership(
  purchaseId: string,
): Promise<Result<null>> {
  const res = await invoke<FnResponse>("billing-membership", {
    action: "keep",
    purchaseId,
  });
  return res.ok ? ok(null) : res;
}

/** One row of the Invoices table: a membership invoice or a one-off
 * package receipt from the caller's Stripe Customer. */
export type InvoiceSummary = {
  id: string;
  /** Stripe's invoice number; null for a one-off payment receipt. */
  number: string | null;
  description: string;
  date: string;
  amountCents: number;
  currency: string;
  status: "paid" | "failed" | "due";
  /** Stripe's hosted invoice page or receipt. */
  url: string | null;
};

export async function listInvoices(): Promise<Result<InvoiceSummary[]>> {
  const res = await invoke<FnResponse & { invoices: InvoiceSummary[] }>(
    "billing-invoices",
    { action: "list" },
  );
  if (!res.ok) return res;
  return ok(res.data.invoices);
}

/** Retries a failed membership charge against the card on file. */
export async function retryMembershipPayment(
  purchaseId: string,
): Promise<Result<null>> {
  const res = await invoke<FnResponse>("billing-invoices", {
    action: "pay",
    purchaseId,
  });
  return res.ok ? ok(null) : res;
}
