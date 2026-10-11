import type { MyPackagePurchase } from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  accessLine,
  canStop,
  nameList,
  packageInitials,
  statusTag,
  visiblePurchases,
} from "./purchases";

const base: MyPackagePurchase = {
  id: "p1",
  package_id: "k1",
  package_name: "Pack",
  package_slug: "pack",
  billing_type: "one_time",
  billing_interval: null,
  access_weeks: null,
  payer_profile_id: "me",
  athlete_profile_id: "me",
  athlete_first_name: "Sarah",
  athlete_last_name: "Whitfield",
  athlete_username: "sarahw",
  kind: "one_time",
  status: "active",
  amount_cents: 24900,
  currency: "nzd",
  current_period_end: null,
  access_until: null,
  paid_at: null,
  canceled_at: null,
  cancel_at_period_end: false,
  created_at: "2026-10-01T00:00:00Z",
  program_names: [],
  coach_names: [],
};

const sub: MyPackagePurchase = {
  ...base,
  kind: "subscription",
  billing_type: "recurring",
  billing_interval: "month",
  current_period_end: "2026-11-01T00:00:00Z",
  paid_at: "2026-10-01T00:00:00Z",
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

describe("visiblePurchases", () => {
  const paid = "2026-10-01T00:00:00Z";
  it("hides unpaid incomplete and abandoned expired attempts", () => {
    expect(
      visiblePurchases([
        { ...base, id: "a", status: "incomplete" },
        { ...base, id: "b", status: "expired" },
      ]),
    ).toEqual([]);
  });
  it("keeps a paid one-off after it has been retired as expired", () => {
    const rows = visiblePurchases([
      { ...base, id: "old", status: "expired", paid_at: paid },
      { ...base, id: "new", status: "active", paid_at: paid },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["old", "new"]);
  });
});

describe("cancelled memberships", () => {
  const ending = { ...sub, cancel_at_period_end: true };
  it("an ending subscription reads 'Access until' and is tagged Cancelled", () => {
    expect(accessLine(ending)).toMatch(/^Access until /);
    expect(statusTag(ending)?.label).toBe("Cancelled");
  });
  it("plain active has no tag", () => {
    expect(statusTag(sub)).toBeNull();
  });
});

describe("canStop", () => {
  it("lets the payer stop an active or failed subscription", () => {
    expect(canStop(sub, "me")).toBe(true);
    expect(canStop({ ...sub, status: "past_due" }, "me")).toBe(true);
  });
  it("blocks non-payers, one-offs, ended and already-ending ones", () => {
    expect(canStop(sub, "someone-else")).toBe(false);
    expect(canStop({ ...base, paid_at: "2026-10-01T00:00:00Z" }, "me")).toBe(
      false,
    );
    expect(canStop({ ...sub, status: "canceled" }, "me")).toBe(false);
    expect(canStop({ ...sub, cancel_at_period_end: true }, "me")).toBe(false);
  });
});

describe("nameList / packageInitials", () => {
  it("joins names the way the design reads them", () => {
    expect(nameList([])).toBe("");
    expect(nameList(["A"])).toBe("A");
    expect(nameList(["A", "B", "C"])).toBe("A, B and C");
  });
  it("takes the first two capitalised words", () => {
    expect(packageInitials("Off-Season Performance Pack")).toBe("OP");
    expect(packageInitials("u16 dev")).toBe("UD");
  });
});
