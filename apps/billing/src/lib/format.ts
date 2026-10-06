import type { PackageBillingInterval, PublicPackage } from "@hooper/db";

/** "$39.00" — prices are whole NZD cents, GST inclusive. */
export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** GST portion of a GST-inclusive amount (15% → 3/23 of the total). */
export function gstOfCents(cents: number): number {
  return Math.round((cents * 3) / 23);
}

const INTERVAL_LABEL: Record<PackageBillingInterval, string> = {
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
};

/** The "/ month" or "/ 12 weeks" suffix beside a package price. */
export function perLabel(
  pkg: Pick<
    PublicPackage,
    "billing_type" | "billing_interval" | "access_weeks"
  >,
): string {
  if (pkg.billing_type === "recurring" && pkg.billing_interval) {
    return `/ ${INTERVAL_LABEL[pkg.billing_interval]}`;
  }
  return pkg.access_weeks ? `/ ${pkg.access_weeks} weeks` : "one-off";
}

/** The fine-print billing line under a package price. */
export function billingLine(
  pkg: Pick<
    PublicPackage,
    "billing_type" | "billing_interval" | "access_weeks"
  >,
): string {
  if (pkg.billing_type === "recurring" && pkg.billing_interval) {
    const every =
      pkg.billing_interval === "quarter"
        ? "every 3 months"
        : `${pkg.billing_interval}ly`;
    return `Billed ${every}, cancel any time`;
  }
  return pkg.access_weeks
    ? `One payment, ${pkg.access_weeks} weeks of access`
    : "One payment, ongoing access";
}

/** "8 weeks, 3 sessions a week" for a program in a package. */
export function programMeta(p: { weeks: number; session_count: number }) {
  const parts: string[] = [];
  if (p.weeks > 0) parts.push(`${p.weeks} week${p.weeks === 1 ? "" : "s"}`);
  if (p.weeks > 0 && p.session_count > 0) {
    const perWeek = Math.round(p.session_count / p.weeks);
    parts.push(`${perWeek} session${perWeek === 1 ? "" : "s"} a week`);
  } else if (p.session_count > 0) {
    parts.push(`${p.session_count} sessions`);
  }
  return parts.join(", ");
}

export function initials(first: string | null, last: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

export function fullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(" ");
}

/** "12 Oct 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
