import type { MyPackagePurchase, PackageBillingInterval } from "@hooper/db";

/** Purchases that currently give access or will charge again. */
export function isLive(p: MyPackagePurchase, now = new Date()): boolean {
  if (p.status !== "active" && p.status !== "past_due") return false;
  if (p.kind === "one_time" && p.access_until) {
    return new Date(p.access_until) > now;
  }
  return true;
}

export type CycleTotal = {
  /** "month", "week", … or "one_off" for one-payment packages. */
  cycle: PackageBillingInterval | "one_off";
  cents: number;
  count: number;
};

const ORDER: CycleTotal["cycle"][] = [
  "week",
  "month",
  "quarter",
  "year",
  "one_off",
];

/** Live household spend grouped by billing cycle — each package is charged
 * on its own, so there's no single household figure, just per-cycle sums
 * (e.g. $58/month + $249 one-off). */
export function householdTotals(
  purchases: MyPackagePurchase[],
  now = new Date(),
): CycleTotal[] {
  const byCycle = new Map<CycleTotal["cycle"], CycleTotal>();
  for (const p of purchases) {
    if (!isLive(p, now)) continue;
    const cycle =
      p.kind === "subscription" && p.billing_interval
        ? p.billing_interval
        : "one_off";
    const t = byCycle.get(cycle) ?? { cycle, cents: 0, count: 0 };
    t.cents += p.amount_cents;
    t.count += 1;
    byCycle.set(cycle, t);
  }
  return ORDER.flatMap((c) => byCycle.get(c) ?? []);
}

export function cycleLabel(cycle: CycleTotal["cycle"]): string {
  return cycle === "one_off" ? "one-off" : `/ ${cycle}`;
}

/** Upcoming subscription renewals, soonest first. */
export function nextCharges(
  purchases: MyPackagePurchase[],
  now = new Date(),
): MyPackagePurchase[] {
  return purchases
    .filter(
      (p) =>
        p.kind === "subscription" &&
        isLive(p, now) &&
        p.current_period_end &&
        new Date(p.current_period_end) > now,
    )
    .sort(
      (a, b) =>
        new Date(a.current_period_end!).getTime() -
        new Date(b.current_period_end!).getTime(),
    );
}
