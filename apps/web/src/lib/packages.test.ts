import { describe, expect, it } from "vitest";
import {
  centsToDollars,
  dollarsToCents,
  draftToPricing,
  formatPackagePrice,
  formatPackagePriceCell,
  normalizeSlugInput,
  pricingToDraft,
  slugifyPackageName,
  validatePackageSlug,
} from "./packages";

describe("slugifyPackageName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyPackageName("Off-Season Performance Pack")).toBe(
      "off-season-performance-pack",
    );
  });

  it("collapses punctuation and trims edge hyphens", () => {
    expect(slugifyPackageName("  Guard Skills 1:1!! ")).toBe(
      "guard-skills-1-1",
    );
  });

  it("caps at 40 characters without a trailing hyphen", () => {
    const slug = slugifyPackageName(
      "Pre season speed and agility block for u sixteen",
    );
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
    expect(validatePackageSlug(slug)).toBeNull();
  });
});

describe("normalizeSlugInput", () => {
  it("lowercases and turns whitespace into hyphens", () => {
    expect(normalizeSlugInput("My Pack")).toBe("my-pack");
  });
});

describe("validatePackageSlug", () => {
  it.each([
    ["", "Required"],
    ["ab", "At least 3 characters"],
    ["a".repeat(41), "At most 40 characters"],
    ["bad--slug", "Lowercase letters, numbers and single hyphens only"],
    ["-lead", "Lowercase letters, numbers and single hyphens only"],
    ["Upper", "Lowercase letters, numbers and single hyphens only"],
    ["in_season", "Lowercase letters, numbers and single hyphens only"],
  ])("rejects %j", (slug, error) => {
    expect(validatePackageSlug(slug)).toBe(error);
  });

  it("accepts a valid slug", () => {
    expect(validatePackageSlug("in-season-2")).toBeNull();
  });
});

describe("dollarsToCents / centsToDollars", () => {
  it("round-trips whole and fractional dollars", () => {
    expect(dollarsToCents("249")).toBe(24900);
    expect(dollarsToCents("29.5")).toBe(2950);
    expect(dollarsToCents("0.99")).toBe(99);
    expect(centsToDollars(24900)).toBe("249");
    expect(centsToDollars(2950)).toBe("29.50");
  });

  it("rejects invalid input", () => {
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("-5")).toBeNull();
    expect(dollarsToCents("1.234")).toBeNull();
    expect(dollarsToCents("abc")).toBeNull();
  });
});

describe("draftToPricing", () => {
  it("keeps only the interval for recurring", () => {
    const result = draftToPricing({
      price: "29",
      billing_type: "recurring",
      billing_interval: "week",
      access_weeks: "12",
      unlimited_access: false,
    });
    expect(result).toEqual({
      ok: true,
      pricing: {
        price_cents: 2900,
        billing_type: "recurring",
        billing_interval: "week",
        access_weeks: null,
      },
    });
  });

  it("keeps only access weeks for one-off", () => {
    const result = draftToPricing({
      price: "249",
      billing_type: "one_time",
      billing_interval: "month",
      access_weeks: "12",
      unlimited_access: false,
    });
    expect(result).toEqual({
      ok: true,
      pricing: {
        price_cents: 24900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: 12,
      },
    });
  });

  it("rejects a zero access length", () => {
    const result = draftToPricing({
      price: "10",
      billing_type: "one_time",
      billing_interval: "month",
      access_weeks: "0",
      unlimited_access: false,
    });
    expect(result.ok).toBe(false);
  });

  it("stores unlimited one-off access as null weeks", () => {
    const result = draftToPricing({
      price: "249",
      billing_type: "one_time",
      billing_interval: "month",
      access_weeks: "0",
      unlimited_access: true,
    });
    expect(result).toEqual({
      ok: true,
      pricing: {
        price_cents: 24900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: null,
      },
    });
  });

  it("round-trips unlimited access through pricingToDraft", () => {
    const pricing = {
      price_cents: 24900,
      billing_type: "one_time" as const,
      billing_interval: null,
      access_weeks: null,
    };
    expect(pricingToDraft(pricing).unlimited_access).toBe(true);
    expect(draftToPricing(pricingToDraft(pricing))).toEqual({
      ok: true,
      pricing,
    });
  });

  it("round-trips through pricingToDraft", () => {
    const pricing = {
      price_cents: 8900,
      billing_type: "one_time" as const,
      billing_interval: null,
      access_weeks: 4,
    };
    expect(draftToPricing(pricingToDraft(pricing))).toEqual({
      ok: true,
      pricing,
    });
  });
});

describe("formatPackagePrice", () => {
  it("formats recurring and one-off packages", () => {
    expect(
      formatPackagePrice({
        price_cents: 2900,
        billing_type: "recurring",
        billing_interval: "month",
        access_weeks: null,
      }),
    ).toBe("$29 / month");
    expect(
      formatPackagePrice({
        price_cents: 24900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: 12,
      }),
    ).toBe("$249 · 12 weeks");
    expect(
      formatPackagePrice({
        price_cents: 2900,
        billing_type: "recurring",
        billing_interval: "quarter",
        access_weeks: null,
      }),
    ).toBe("$29 / quarter");
    expect(
      formatPackagePrice({
        price_cents: 24900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: null,
      }),
    ).toBe("$249 · Unlimited access");
  });

  it("formats the list price cell", () => {
    expect(
      formatPackagePriceCell({
        price_cents: 8900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: 4,
      }),
    ).toEqual({ price: "$89", sub: "One payment · 4 wk" });
    expect(
      formatPackagePriceCell({
        price_cents: 8900,
        billing_type: "one_time",
        billing_interval: null,
        access_weeks: null,
      }),
    ).toEqual({ price: "$89", sub: "One payment · Unlimited" });
  });
});
