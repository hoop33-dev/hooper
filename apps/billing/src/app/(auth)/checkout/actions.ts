"use server";

import {
  getMyPurchases,
  startCheckout,
  type CheckoutError,
  type CheckoutStart,
} from "@/src/services/billing.service";
import type { PackagePurchaseStatus } from "@hooper/db";

export async function startCheckoutAction(
  slug: string,
): Promise<
  { ok: true; data: CheckoutStart } | { ok: false; error: CheckoutError }
> {
  return startCheckout(slug);
}

/** Polled by /welcome while the Stripe webhook catches up. */
export async function purchaseStatusAction(
  purchaseId: string,
): Promise<{ status: PackagePurchaseStatus; packageName: string } | null> {
  const res = await getMyPurchases();
  if (!res.ok) return null;
  const p = res.data.find((row) => row.id === purchaseId);
  return p ? { status: p.status, packageName: p.package_name } : null;
}
