import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { MyPackagePurchase } from "@hooper/db";

/** Stripe work happens in Supabase edge functions (they hold the Stripe
 * secret and service-role keys). These wrappers invoke them with the signed-in
 * user's session JWT. */

export type CheckoutStart =
  | {
      status: "requires_payment";
      mode: "subscription" | "payment";
      purchaseId: string;
      clientSecret: string;
      amountCents: number;
      currency: string;
    }
  | { status: "processing"; purchaseId: string }
  | { status: "already_owned"; purchaseId: string };

export type CheckoutError = {
  code?: "not_found" | "in_progress";
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

type FnResponse = { ok: boolean; error?: string; code?: string };

async function invoke<T extends FnResponse>(
  name: string,
  body: Record<string, unknown>,
): Promise<Result<T>> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  // Non-2xx responses surface as FunctionsHttpError; the JSON body still
  // carries our { ok:false, error } message.
  if (error) {
    const context = (error as { context?: Response }).context;
    try {
      const payload = (await context?.json()) as FnResponse | undefined;
      if (payload?.error) return err(payload.error);
    } catch {
      // fall through to the generic message
    }
    return err("Something went wrong. Please try again.");
  }
  if (!data) return err("Something went wrong. Please try again.");
  if (!data.ok)
    return err(data.error ?? "Something went wrong. Please try again.");
  return ok(data);
}

export async function startCheckout(
  slug: string,
): Promise<
  { ok: true; data: CheckoutStart } | { ok: false; error: CheckoutError }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<
    FnResponse & Partial<CheckoutStart>
  >("billing-checkout", { body: { slug } });

  let payload: (FnResponse & Partial<CheckoutStart>) | null = data;
  if (error) {
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      payload = null;
    }
  }
  if (!payload) {
    return { ok: false, error: { message: "Unable to start checkout." } };
  }
  if (!payload.ok) {
    return {
      ok: false,
      error: {
        code:
          payload.code === "not_found" || payload.code === "in_progress"
            ? payload.code
            : undefined,
        message: payload.error ?? "Unable to start checkout.",
      },
    };
  }
  return { ok: true, data: payload as CheckoutStart };
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

export async function getMyPurchases(): Promise<Result<MyPackagePurchase[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_package_purchases");
  if (error) return err(error.message);
  return ok(data ?? []);
}
