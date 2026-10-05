import type { TagTone } from "@/src/components/ui/primitives";
import type { MyPackagePurchase, PackagePurchaseStatus } from "@hooper/db";
import { formatDate } from "./format";

const STATUS: Record<PackagePurchaseStatus, { label: string; tone: TagTone }> =
  {
    active: { label: "Active", tone: "green" },
    past_due: { label: "Payment failed", tone: "danger" },
    incomplete: { label: "Unpaid", tone: "amber" },
    canceled: { label: "Cancelled", tone: "neutral" },
    expired: { label: "Ended", tone: "neutral" },
  };

function isExpired(p: MyPackagePurchase, now = new Date()) {
  return (
    p.kind === "one_time" && !!p.access_until && new Date(p.access_until) < now
  );
}

/** The status pill for a purchase (an elapsed one-off reads "Ended"). */
export function statusTag(p: MyPackagePurchase) {
  return isExpired(p) ? STATUS.expired : STATUS[p.status];
}

/** "Renews 12 Oct 2026" / "Access until …" / "Ongoing access". */
export function accessLine(p: MyPackagePurchase): string {
  if (p.status === "canceled") {
    return p.current_period_end
      ? `Ended ${formatDate(p.current_period_end)}`
      : "Cancelled";
  }
  if (p.kind === "subscription") {
    return p.current_period_end
      ? `Renews ${formatDate(p.current_period_end)}`
      : "Monthly";
  }
  if (!p.access_until) return "Ongoing access";
  const ended = new Date(p.access_until) < new Date();
  return `${ended ? "Ended" : "Access until"} ${formatDate(p.access_until)}`;
}

/** Abandoned checkouts (incomplete, or expired without paying) aren't
 * purchases from the user's point of view. Paid one-offs that have run out
 * stay, labelled "Ended". */
export function visiblePurchases(purchases: MyPackagePurchase[]) {
  return purchases.filter((p) => p.paid_at !== null);
}

/** Purchases whose access belongs to the given profile. */
export function purchasesFor(
  purchases: MyPackagePurchase[],
  profileId: string,
) {
  return purchases.filter((p) => p.athlete_profile_id === profileId);
}
