import type { MyPackagePurchase } from "@hooper/db";
import { describe, expect, it } from "vitest";
import { accessLine } from "./PackagesCard";

const base: MyPackagePurchase = {
  id: "p1",
  package_id: "k1",
  package_name: "Pack",
  package_slug: "pack",
  billing_interval: null,
  kind: "one_time",
  status: "active",
  amount_cents: 24900,
  currency: "nzd",
  current_period_end: null,
  access_until: null,
  paid_at: null,
  created_at: "2026-10-01T00:00:00Z",
};

describe("accessLine", () => {
  it("one-off without an end date is ongoing", () => {
    expect(accessLine(base)).toBe("Ongoing access");
  });
  it("one-off with a future end date", () => {
    expect(
      accessLine({ ...base, access_until: "2999-01-01T00:00:00Z" }),
    ).toMatch(/^Access until /);
  });
  it("one-off in the past has ended", () => {
    expect(
      accessLine({ ...base, access_until: "2020-01-01T00:00:00Z" }),
    ).toMatch(/^Ended /);
  });
  it("subscription shows its renewal", () => {
    expect(
      accessLine({
        ...base,
        kind: "subscription",
        current_period_end: "2026-11-01T00:00:00Z",
      }),
    ).toMatch(/^Renews /);
  });
});
