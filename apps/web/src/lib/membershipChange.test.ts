import type { AthleteMembership } from "@/src/services/athleteBilling.service";
import { switchLabel } from "@hooper/shared";
import { describe, expect, it } from "vitest";
import {
  applyMembershipChange,
  buildTimeline,
  changeCtaLabel,
  daysBetween,
  defaultDates,
  formatDay,
  isUpcoming,
  PENDING_PREFIX,
  renewalDay,
  startsLabel,
  zonedDay,
  type AddSide,
  type CancelSide,
} from "./membershipChange";

const today = "2026-11-02";
// Renews 10:00 NZDT on Nov 12.
const academy: CancelSide = {
  name: "Academy",
  when: "period_end",
  periodEnd: "2026-11-11T21:00:00Z",
};
const monthly: AddSide = {
  name: "Elite",
  recurring: true,
  priceCents: 12900,
  interval: "month",
  accessWeeks: null,
};

describe("zonedDay", () => {
  it("uses the NZ calendar day", () => {
    expect(zonedDay("2026-11-11T11:30:00Z")).toBe("2026-11-12");
    expect(zonedDay("2026-11-11T10:30:00Z")).toBe("2026-11-11");
  });
});

describe("daysBetween / formatDay", () => {
  it("counts whole days across months", () => {
    expect(daysBetween("2026-11-02", "2026-12-01")).toBe(29);
    expect(daysBetween("2026-11-12", "2026-11-02")).toBe(-10);
  });
  it("labels today and drops the year when it's this year", () => {
    expect(formatDay(today, today)).toBe("Today");
    expect(formatDay("2026-11-12", today)).toBe("Nov 12");
    expect(formatDay("2027-01-04", today)).toBe("Jan 4, 2027");
  });
});

describe("isUpcoming", () => {
  const now = new Date("2026-11-02T00:00:00Z");
  it("is true only for a start in the future", () => {
    expect(isUpcoming(null, now)).toBe(false);
    expect(isUpcoming("2026-11-01T00:00:00Z", now)).toBe(false);
    expect(isUpcoming("2026-11-03T00:00:00Z", now)).toBe(true);
  });
});

describe("startsLabel", () => {
  const now = new Date("2026-11-02T00:00:00Z");
  it("adds the year only when it's a later year", () => {
    expect(startsLabel("2026-11-11T21:00:00Z", now)).toBe("Starts Nov 12");
    expect(startsLabel("2027-10-08T01:46:03Z", now)).toBe("Starts Oct 8, 2027");
  });
});

describe("defaultDates", () => {
  it("starts and bills today with nothing cancelled", () => {
    expect(defaultDates(null, today)).toEqual({
      start: today,
      billing: today,
    });
  });
  it("bills from the chosen start when only adding", () => {
    expect(defaultDates(null, today, "2026-11-20")).toEqual({
      start: "2026-11-20",
      billing: "2026-11-20",
    });
  });
  it("picks up where an end-of-period cancel leaves off", () => {
    expect(defaultDates(academy, today)).toEqual({
      start: "2026-11-12",
      billing: "2026-11-12",
    });
  });
  it("starts now but keeps the old billing date on an immediate cancel", () => {
    expect(defaultDates({ ...academy, when: "now" }, today)).toEqual({
      start: today,
      billing: "2026-11-12",
    });
  });
  it("never defaults to a day in the past", () => {
    const lapsed = { ...academy, periodEnd: "2026-10-01T00:00:00Z" };
    expect(renewalDay(lapsed, today)).toBe(today);
  });
});

describe("buildTimeline", () => {
  it("orders the switch: ends, starts, then charges", () => {
    const events = buildTimeline({
      cancel: academy,
      add: monthly,
      start: "2026-11-12",
      billing: "2026-11-12",
      today,
      cardLabel: "Visa •••• 4242",
    });
    expect(events.map((e) => e.title)).toEqual([
      "Academy ends",
      "Elite starts",
      "First charge $129",
    ]);
    expect(events[2].sub).toBe("Then every month to Visa •••• 4242");
  });
  it("sorts by day, so a charge before access comes first", () => {
    const events = buildTimeline({
      cancel: null,
      add: { ...monthly, recurring: false, interval: null, accessWeeks: 6 },
      start: "2026-11-20",
      billing: "2026-11-05",
      today,
      cardLabel: null,
    });
    expect(events.map((e) => e.tone)).toEqual(["orange", "green"]);
    expect(events[0].sub).toBe("One payment, 6 weeks of access");
  });
  it("ends today on an immediate cancel", () => {
    const [ends] = buildTimeline({
      cancel: { ...academy, when: "now" },
      add: null,
      start: today,
      billing: today,
      today,
      cardLabel: null,
    });
    expect(ends.day).toBe(today);
  });
});

describe("changeCtaLabel", () => {
  it("names the action", () => {
    expect(changeCtaLabel(true, true, "now")).toBe("Switch package");
    expect(changeCtaLabel(false, true, "now")).toBe("Add package");
    expect(changeCtaLabel(true, false, "now")).toBe("Cancel now");
    expect(changeCtaLabel(true, false, "period_end")).toBe(
      "Cancel at period end",
    );
  });
});

describe("switchLabel", () => {
  it("reads Switching while it runs out and Switched once ended", () => {
    expect(switchLabel("Elite", false)).toBe("Switching to Elite");
    expect(switchLabel("Elite", true)).toBe("Switched to Elite");
  });
  it("is null when it wasn't switched", () => {
    expect(switchLabel(null, true)).toBeNull();
  });
});

describe("applyMembershipChange", () => {
  const now = new Date("2026-11-02T00:00:00Z"); // 1pm NZDT
  const periodEnd = "2026-11-12T10:00:00.000Z"; // 11pm Nov 12 NZDT
  const old: AthleteMembership = {
    id: "old",
    packageId: "pkg-old",
    packageName: "Academy",
    kind: "subscription",
    status: "active",
    amountCents: 5000,
    currency: "nzd",
    interval: "month",
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    paidAt: "2026-10-12T10:00:00.000Z",
    accessUntil: null,
    createdAt: "2026-09-12T10:00:00.000Z",
    payerProfileId: "payer",
    startsAt: null,
    billingStartsAt: null,
    switchedToName: null,
  };
  const elite = {
    name: "Elite",
    price_cents: 9000,
    billing_type: "recurring" as const,
    billing_interval: "month" as const,
    access_weeks: null,
  };
  const add = {
    packageId: "pkg-elite",
    payerProfileId: "payer",
    startDate: "2026-11-12",
    billingDate: "2026-11-12",
  };

  it("a switch at period end links the old one and adds the new one first", () => {
    const [ghost, kept] = applyMembershipChange(
      [old],
      { cancel: { purchaseId: "old", when: "period_end" }, add },
      elite,
      now,
    );
    expect(kept).toMatchObject({
      cancelAtPeriodEnd: true,
      status: "active",
      switchedToName: "Elite",
    });
    expect(ghost.id.startsWith(PENDING_PREFIX)).toBe(true);
    // Lined up with the old renewal to the second, like the edge function.
    expect(ghost).toMatchObject({
      packageName: "Elite",
      startsAt: periodEnd,
      billingStartsAt: periodEnd,
      currentPeriodEnd: periodEnd,
    });
  });

  it("cancelling now ends it straight away", () => {
    const [row] = applyMembershipChange(
      [old],
      { cancel: { purchaseId: "old", when: "now" } },
      undefined,
      now,
    );
    expect(row).toMatchObject({ status: "canceled", switchedToName: null });
  });

  it("a package starting today has no future start", () => {
    const [ghost] = applyMembershipChange(
      [old],
      { add: { ...add, startDate: "2026-11-02", billingDate: "2026-11-02" } },
      elite,
      now,
    );
    expect(ghost.startsAt).toBeNull();
    expect(ghost.billingStartsAt).toBeNull();
  });
});
