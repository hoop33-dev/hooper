import { describe, expect, it } from "vitest";
import {
  chargeDays,
  joinNames,
  membershipCounts,
  outstanding,
  whoFor,
} from "./overview";
import { purchase } from "./testFixtures";

const now = new Date("2026-10-12T00:00:00Z");
const mine = { athlete_profile_id: "me", athlete_first_name: "Sarah" };

describe("outstanding", () => {
  it("is failed renewals the caller pays for", () => {
    const rows = [
      purchase({ id: "a", status: "past_due" }),
      purchase({ id: "b", status: "past_due", payer_profile_id: "parent" }),
      purchase({ id: "c" }),
    ];
    expect(outstanding(rows, "me").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("whoFor / joinNames", () => {
  it("reads the caller as You", () => {
    expect(whoFor(purchase(mine), "me")).toBe("You");
    expect(whoFor(purchase(), "me")).toBe("Liam");
  });
  it("joins and de-duplicates names", () => {
    expect(joinNames(["You", "Liam", "Liam", "Maya"])).toBe(
      "You, Liam and Maya",
    );
    expect(joinNames(["You"])).toBe("You");
  });
});

describe("chargeDays", () => {
  it("groups renewals on the same day, soonest first", () => {
    const days = chargeDays(
      [
        purchase({ id: "a", current_period_end: "2026-11-01T02:00:00Z" }),
        purchase({
          id: "b",
          ...mine,
          amount_cents: 1500,
          current_period_end: "2026-11-01T05:00:00Z",
        }),
        purchase({ id: "c", current_period_end: "2026-10-20T00:00:00Z" }),
      ],
      "me",
      now,
    );
    expect(days.map((d) => [d.cents, d.who])).toEqual([
      [3900, ["Liam"]],
      [5400, ["Liam", "You"]],
    ]);
  });
  it("skips cancelled memberships that won't renew", () => {
    expect(
      chargeDays([purchase({ cancel_at_period_end: true })], "me", now),
    ).toEqual([]);
  });
});

describe("membershipCounts", () => {
  it("counts live memberships per person, You first", () => {
    const { total, byPerson } = membershipCounts(
      [
        purchase({ id: "a" }),
        purchase({ id: "b", ...mine }),
        purchase({ id: "c", status: "canceled" }),
      ],
      "me",
      now,
    );
    expect(total).toBe(2);
    expect(byPerson).toBe("You 1, Liam 1");
  });
});
