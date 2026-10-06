"use server";

import {
  getMyPurchases,
  startCheckout,
  type CheckoutError,
  type CheckoutStart,
} from "@/src/services/billing.service";
import { getMyProfile } from "@/src/services/profile.service";
import type { PackagePurchaseStatus } from "@hooper/db";

export async function startCheckoutAction(
  slug: string,
  athleteProfileId?: string,
): Promise<
  { ok: true; data: CheckoutStart } | { ok: false; error: CheckoutError }
> {
  return startCheckout(slug, athleteProfileId);
}

/** Polled by /welcome while the Stripe webhook catches up. */
export async function purchaseStatusAction(purchaseId: string): Promise<{
  status: PackagePurchaseStatus;
  packageName: string;
  /** Set when the purchase was for one of the caller's children. */
  child: { firstName: string | null; username: string | null } | null;
} | null> {
  const [res, profile] = await Promise.all([getMyPurchases(), getMyProfile()]);
  if (!res.ok) return null;
  const p = res.data.find((row) => row.id === purchaseId);
  if (!p) return null;
  const forChild = profile.ok && p.athlete_profile_id !== profile.data.id;
  return {
    status: p.status,
    packageName: p.package_name,
    child: forChild
      ? { firstName: p.athlete_first_name, username: p.athlete_username }
      : null,
  };
}
