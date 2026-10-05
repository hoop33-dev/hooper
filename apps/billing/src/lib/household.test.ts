import { describe, expect, it } from "vitest";
import { cycleLabel, householdTotals, isLive, nextCharges } from "./household";
import { purchase } from "./testFixtures";

const now = new Date("2026-10-05T00:00:00Z");

describe("isLive", () => {
  it("counts active and past_due, not cancelled/incomplete", () => {
    expect(isLive(purchase(), now)).toBe(true);
    expect(isLive(purchase({ status: "past_due" }), now)).toBe(true);
    expect(isLive(purchase({ status: "canceled" }), now)).toBe(false);
    expect(isLive(purchase({ status: "incomplete" }), now)).toBe(false);
  });
  it("drops elapsed one-offs", () => {
    const oneOff = {
      kind: "one_time" as const,
      billing_type: "one_time" as const,
      billing_interval: null,
    };
    expect(
      isLive(
        purchase({ ...oneOff, access_until: "2026-01-01T00:00:00Z" }),
        now,
      ),
    ).toBe(false);
    expect(
      isLive(
        purchase({ ...oneOff, access_until: "2027-01-01T00:00:00Z" }),
        now,
      ),
    ).toBe(true);
    expect(isLive(purchase({ ...oneOff, access_until: null }), now)).toBe(true);
  });
});

describe("householdTotals", () => {
  it("groups live spend by cycle in a stable order", () => {
    const totals = householdTotals(
      [
        purchase({ id: "a", amount_cents: 3900 }),
        purchase({ id: "b", amount_cents: 1900, athlete_profile_id: "kid2" }),
        purchase({
          id: "c",
          kind: "one_time",
          billing_type: "one_time",
          billing_interval: null,
          amount_cents: 24900,
        }),
        purchase({ id: "d", billing_interval: "week", amount_cents: 1000 }),
        purchase({ id: "e", status: "canceled", amount_cents: 9999 }),
      ],
      now,
    );
    expect(totals).toEqual([
      { cycle: "week", cents: 1000, count: 1 },
      { cycle: "month", cents: 5800, count: 2 },
      { cycle: "one_off", cents: 24900, count: 1 },
    ]);
  });
  it("is empty with nothing live", () => {
    expect(householdTotals([purchase({ status: "canceled" })], now)).toEqual(
      [],
    );
  });
  it("labels cycles", () => {
    expect(cycleLabel("month")).toBe("/ month");
    expect(cycleLabel("one_off")).toBe("one-off");
  });
});

describe("nextCharges", () => {
  it("lists upcoming renewals soonest first, subscriptions only", () => {
    const list = nextCharges(
      [
        purchase({ id: "late", current_period_end: "2026-12-01T00:00:00Z" }),
        purchase({ id: "soon", current_period_end: "2026-10-12T00:00:00Z" }),
        purchase({ id: "past", current_period_end: "2026-09-01T00:00:00Z" }),
        purchase({
          id: "oneoff",
          kind: "one_time",
          billing_type: "one_time",
          billing_interval: null,
        }),
      ],
      now,
    );
    expect(list.map((p) => p.id)).toEqual(["soon", "late"]);
  });
});
