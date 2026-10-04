import type {
  PackageBillingInterval,
  PackageBillingType,
  PackageRow,
} from "@hooper/db";

export const PACKAGE_SLUG_MAX = 40;
export const PACKAGE_SLUG_MIN = 3;

/** Shown before the slug in the create form and link card. The protocol is
 * dropped for display; `packageLink` adds it back for copying. */
export const PACKAGE_LINK_BASE =
  process.env.NEXT_PUBLIC_PACKAGE_LINK_BASE ??
  "https://hooper.co.nz/start?package=";

export const PACKAGE_LINK_PREFIX = PACKAGE_LINK_BASE.replace(
  /^https?:\/\//,
  "",
);

export function packageLink(slug: string): string {
  return PACKAGE_LINK_BASE + slug;
}

/** Auto-fills the package ID from its name until the coach edits the ID. */
export function slugifyPackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PACKAGE_SLUG_MAX)
    .replace(/-+$/, "");
}

/** Normalises what the coach types into the ID field: lowercase, and
 * whitespace becomes a hyphen. Validation reports anything else. */
export function normalizeSlugInput(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

/** Format rules only, mirroring the DB CHECK constraint. "Already in use"
 * needs the server (`package_slug_available`). */
export function validatePackageSlug(slug: string): string | null {
  if (!slug) return "Required";
  if (slug.length < PACKAGE_SLUG_MIN) return "At least 3 characters";
  if (slug.length > PACKAGE_SLUG_MAX) return "At most 40 characters";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return "Lowercase letters, numbers and single hyphens only";
  }
  return null;
}

export type PackagePricing = {
  price_cents: number;
  billing_type: PackageBillingType;
  billing_interval: PackageBillingInterval | null;
  access_weeks: number | null;
};

/** Pricing as edited in the form — whole-dollar input plus both the
 * interval and access length, so flipping the billing toggle (or the
 * unlimited-access switch) back and forth doesn't lose either value. */
export type PackagePricingDraft = {
  price: string;
  billing_type: PackageBillingType;
  billing_interval: PackageBillingInterval;
  access_weeks: string;
  /** One-off only: access never expires (stored as access_weeks = null). */
  unlimited_access: boolean;
};

export const DEFAULT_PRICING_DRAFT: PackagePricingDraft = {
  price: "49",
  billing_type: "recurring",
  billing_interval: "month",
  access_weeks: "8",
  unlimited_access: false,
};

/** Stripe's minimum charge (NZ$0.50) — anything lower can never be paid
 * for at checkout. Mirrors MIN_CHARGE_CENTS in
 * supabase/functions/_shared/billingMath.ts. */
export const MIN_PRICE_CENTS = 50;

export function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

export function centsToDollars(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function pricingToDraft(pricing: PackagePricing): PackagePricingDraft {
  return {
    price: centsToDollars(pricing.price_cents),
    billing_type: pricing.billing_type,
    billing_interval: pricing.billing_interval ?? "month",
    access_weeks: String(pricing.access_weeks ?? 8),
    unlimited_access:
      pricing.billing_type === "one_time" && pricing.access_weeks === null,
  };
}

/** The draft as a DB-shaped pricing row, or an error string. Only the field
 * that matches `billing_type` is kept — the other is nulled to satisfy the
 * packages_billing_shape constraint. */
export function draftToPricing(
  draft: PackagePricingDraft,
): { ok: true; pricing: PackagePricing } | { ok: false; error: string } {
  const cents = dollarsToCents(draft.price);
  if (cents === null) return { ok: false, error: "Enter a valid price" };
  if (cents < MIN_PRICE_CENTS) {
    return {
      ok: false,
      error: `Minimum price is ${money(MIN_PRICE_CENTS)}`,
    };
  }
  if (draft.billing_type === "recurring") {
    return {
      ok: true,
      pricing: {
        price_cents: cents,
        billing_type: "recurring",
        billing_interval: draft.billing_interval,
        access_weeks: null,
      },
    };
  }
  if (draft.unlimited_access) {
    return {
      ok: true,
      pricing: {
        price_cents: cents,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: null,
      },
    };
  }
  const weeks = Number(draft.access_weeks);
  if (!Number.isInteger(weeks) || weeks < 1) {
    return { ok: false, error: "Access length must be at least 1 week" };
  }
  return {
    ok: true,
    pricing: {
      price_cents: cents,
      billing_type: "one_time",
      billing_interval: null,
      access_weeks: weeks,
    },
  };
}

export function samePricing(a: PackagePricing, b: PackagePricing): boolean {
  return (
    a.price_cents === b.price_cents &&
    a.billing_type === b.billing_type &&
    a.billing_interval === b.billing_interval &&
    a.access_weeks === b.access_weeks
  );
}

function money(cents: number): string {
  return `$${centsToDollars(cents)}`;
}

/** "12 weeks", or "Unlimited access" for a one-off package with no
 * expiry. */
function accessLabel(weeks: number | null): string {
  if (weeks === null) return "Unlimited access";
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

/** "$29 / month", "$249 · 12 weeks" or "$249 · Unlimited access" — the
 * detail header summary. */
export function formatPackagePrice(pkg: PackagePricing): string {
  if (pkg.billing_type === "recurring") {
    return `${money(pkg.price_cents)} / ${pkg.billing_interval}`;
  }
  return `${money(pkg.price_cents)} · ${accessLabel(pkg.access_weeks)}`;
}

/** The list table's two-line price cell. */
export function formatPackagePriceCell(pkg: PackagePricing): {
  price: string;
  sub: string;
} {
  if (pkg.billing_type === "recurring") {
    return {
      price: `${money(pkg.price_cents)} / ${pkg.billing_interval}`,
      sub: "Recurring",
    };
  }
  return {
    price: money(pkg.price_cents),
    sub:
      pkg.access_weeks === null
        ? "One payment · Unlimited"
        : `One payment · ${pkg.access_weeks} wk`,
  };
}

export function packageBillingSummary(pkg: PackagePricing): string {
  return pkg.billing_type === "recurring"
    ? `Billed every ${pkg.billing_interval}`
    : "One payment";
}

export function pickPricing(pkg: PackageRow): PackagePricing {
  return {
    price_cents: pkg.price_cents,
    billing_type: pkg.billing_type,
    billing_interval: pkg.billing_interval,
    access_weeks: pkg.access_weeks,
  };
}
