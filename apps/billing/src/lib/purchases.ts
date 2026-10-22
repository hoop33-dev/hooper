import type { TagTone } from "@/src/components/ui/primitives";
import type { MyPackagePurchase, PackagePurchaseStatus } from "@hooper/db";
import { formatDate } from "./format";

type Status = { label: string; tone: TagTone };

/** Plain "Active" has no tag — the design's text statuses only call out
 * memberships that need attention or are winding down. */
const STATUS: Record<PackagePurchaseStatus, Status | null> = {
  active: null,
  past_due: { label: "Payment failed", tone: "danger" },
  incomplete: { label: "Unpaid", tone: "amber" },
  canceled: { label: "Ended", tone: "neutral" },
  expired: { label: "Ended", tone: "neutral" },
};

const CANCELLED: Status = { label: "Cancelled", tone: "neutral" };

function isExpired(p: MyPackagePurchase, now = new Date()) {
  return (
    p.kind === "one_time" && !!p.access_until && new Date(p.access_until) < now
  );
}

/** Stopped by the payer but still running until the period ends. */
export function isEnding(p: MyPackagePurchase): boolean {
  return p.status === "active" && p.cancel_at_period_end;
}

/** The status tag for a purchase, or null when it's simply active. */
export function statusTag(p: MyPackagePurchase): Status | null {
  if (isExpired(p)) return STATUS.expired;
  if (isEnding(p)) return CANCELLED;
  return STATUS[p.status];
}

/** "Renews 12 Oct 2026" / "Access until …" / "Ongoing access". */
export function accessLine(p: MyPackagePurchase): string {
  if (p.status === "canceled") {
    const ended = p.canceled_at ?? p.current_period_end;
    return ended ? `Ended ${formatDate(ended)}` : "Cancelled";
  }
  if (p.kind === "subscription") {
    if (!p.current_period_end) return "Monthly";
    return `${isEnding(p) ? "Access until" : "Renews"} ${formatDate(p.current_period_end)}`;
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

/** Only the payer can stop a membership, and only a running subscription
 * (one-offs don't renew). */
export function canStop(p: MyPackagePurchase, myProfileId: string): boolean {
  return (
    p.kind === "subscription" &&
    p.payer_profile_id === myProfileId &&
    (p.status === "past_due" || (p.status === "active" && !isEnding(p)))
  );
}

/** "Marcus Davis", "Marcus Davis and Aria Ngata", "A, B and C". */
export function nameList(names: string[]): string {
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "SM" from "Shooting Mechanics" — the package tile's monogram. */
export function packageInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w));
  return (
    words
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** "Oct 2026" — when the membership started. */
export function memberSince(p: MyPackagePurchase): string {
  return new Date(p.paid_at ?? p.created_at).toLocaleDateString("en-NZ", {
    month: "short",
    year: "numeric",
  });
}
