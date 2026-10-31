import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { cache } from "react";
import { invokeFunction } from "./_invoke";

// Shapes returned by the coach-athlete edge function — see
// supabase/functions/coach-athlete/index.ts. Billing data lives in Stripe
// and is fetched live, so none of this is in the database types.

export type AthleteMembership = {
  id: string;
  packageName: string;
  kind: "subscription" | "one_time";
  status: "active" | "past_due" | "canceled" | "expired";
  amountCents: number;
  currency: string;
  /** "month" etc. for a subscription; null for a one-off. */
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paidAt: string | null;
  accessUntil: string | null;
  createdAt: string;
  payerProfileId: string;
};

export type AthleteCard = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  expired: boolean;
};

export type AthletePayer = {
  profileId: string;
  name: string;
  /** The athlete pays for themselves (vs a parent paying). */
  isSelf: boolean;
  card: AthleteCard | null;
};

export type AthleteInvoice = {
  id: string;
  /** Stripe's invoice number, or null for a one-off payment receipt. */
  number: string | null;
  description: string;
  date: string;
  purchaseId: string | null;
  amountCents: number;
  currency: string;
  status: "paid" | "failed" | "due";
  /** Stripe's hosted invoice / PDF, or the receipt for a one-off. */
  url: string | null;
};

export type AthleteBilling = {
  memberships: AthleteMembership[];
  payers: AthletePayer[];
  invoices: AthleteInvoice[];
};

export const getAthleteBilling = cache(
  async (athleteId: string): Promise<Result<AthleteBilling>> => {
    const result = await invokeFunction<AthleteBilling>("coach-athlete", {
      action: "summary",
      athleteId,
    });
    return result.ok ? ok(result.data) : err(result.error);
  },
);

/** Retries one unpaid invoice of the athlete's past_due membership against
 * the card on file. Only collects what's already owing. */
export async function retryAthletePayment(
  athleteId: string,
  purchaseId: string,
  invoiceId: string,
): Promise<Result<void>> {
  const result = await invokeFunction("coach-athlete", {
    action: "retry_payment",
    athleteId,
    purchaseId,
    invoiceId,
  });
  return result.ok ? ok(undefined) : err(result.error);
}

/** Emails the athlete a reset link at the address already on their
 * account. */
export async function sendAthletePasswordReset(
  athleteId: string,
): Promise<Result<void>> {
  const result = await invokeFunction("coach-athlete", {
    action: "send_password_reset",
    athleteId,
  });
  return result.ok ? ok(undefined) : err(result.error);
}
