// Pure billing helpers shared by the Stripe edge functions. No imports, so
// they can be unit-tested outside Deno.

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
