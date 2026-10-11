"use server";

import {
  cancelMembership,
  keepMembership,
} from "@/src/services/billing.service";
import { revalidatePath } from "next/cache";

/** Membership server actions shared by the Memberships page and each
 * child's page. Both revalidate the whole portal: the roster, totals and
 * next-charge cards all read the same purchases. */

export async function stopMembershipAction(
  purchaseId: string,
  reason: string | null,
) {
  const res = await cancelMembership(purchaseId, reason);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

export async function keepMembershipAction(purchaseId: string) {
  const res = await keepMembership(purchaseId);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}
