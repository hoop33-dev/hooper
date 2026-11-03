// Pure billing helpers shared by the Stripe edge functions. No imports, so
// they can be unit-tested outside Deno.

/** Smallest charge Stripe accepts for our currencies (NZ$0.50 and
 * equivalents). Mirrors MIN_PRICE_CENTS in apps/web/src/lib/packages.ts. */
export const MIN_CHARGE_CENTS = 50;

export type PackageBillingType = "recurring" | "one_time";
export type PackageBillingInterval = "week" | "month" | "quarter" | "year";

export type PackagePriceFields = {
  id: string;
  price_cents: number;
  currency: string;
  billing_type: PackageBillingType;
  billing_interval: PackageBillingInterval | null;
};

export type StripeRecurring = {
  interval: "week" | "month" | "year";
  interval_count: number;
};

export type PriceSpec = {
  /** Stripe Price lookup_key — encodes everything that makes a price
   * distinct, so editing a package's price/interval resolves to a new Stripe
   * Price while existing subscribers stay on the old one. */
  lookupKey: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring: StripeRecurring | null;
};

/** Stripe has no "quarter" interval — it's every 3 months. */
export function stripeRecurring(
  interval: PackageBillingInterval,
): StripeRecurring {
  if (interval === "quarter") return { interval: "month", interval_count: 3 };
  return { interval, interval_count: 1 };
}

export function productIdFor(packageId: string): string {
  return `hooper_pkg_${packageId}`;
}

export function priceSpecFor(pkg: PackagePriceFields): PriceSpec {
  const currency = pkg.currency.toLowerCase();
  const recurring =
    pkg.billing_type === "recurring" && pkg.billing_interval
      ? stripeRecurring(pkg.billing_interval)
      : null;
  const cadence = recurring ? pkg.billing_interval : "once";
  return {
    lookupKey: `pkg_${pkg.id}_${pkg.price_cents}_${currency}_${cadence}`,
    productId: productIdFor(pkg.id),
    unitAmount: pkg.price_cents,
    currency,
    recurring,
  };
}

/** One-off packages grant access_weeks from payment; null = unlimited. */
export function accessUntil(
  paidAt: Date,
  accessWeeks: number | null,
): Date | null {
  if (accessWeeks == null) return null;
  return new Date(paidAt.getTime() + accessWeeks * 7 * 24 * 60 * 60 * 1000);
}

export type PurchaseStatus =
  | "incomplete"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

/** Stripe Subscription.status → package_purchases.status. */
export function purchaseStatusForSubscription(status: string): PurchaseStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    default:
      // incomplete, paused
      return "incomplete";
  }
}

/** Coach-picked dates are New Zealand calendar days. */
export const BILLING_TIME_ZONE = "Pacific/Auckland";

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** The calendar day `at` falls on in `timeZone`, as YYYY-MM-DD. */
export function zonedDate(at: Date, timeZone = BILLING_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Offset of `timeZone` from UTC at `at`, in ms (NZST is +12h). */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** 00:00 on `date` (YYYY-MM-DD) in `timeZone`. */
export function zonedMidnight(
  date: string,
  timeZone = BILLING_TIME_ZONE,
): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - zoneOffsetMs(new Date(guess), timeZone);
  // Re-read the offset at the answer, in case a DST change falls between.
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone));
}

/** When a coach-picked day takes effect: null for today ("now"), the exact
 * `anchor` when it falls on that day (so a new package bills on the very
 * second the old one renewed), else midnight that day. */
export function dayToTimestamp(
  date: string,
  now: Date,
  anchor: Date | null = null,
): Date | null {
  if (date <= zonedDate(now)) return null;
  if (anchor && anchor > now && zonedDate(anchor) === date) return anchor;
  return zonedMidnight(date);
}
