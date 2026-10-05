import { describe, expect, it } from "vitest";
import {
  billingLine,
  formatMoney,
  gstOfCents,
  perLabel,
  programMeta,
} from "./format";

describe("money", () => {
  it("formats cents as dollars", () => {
    expect(formatMoney(3900)).toBe("$39.00");
    expect(formatMoney(24950)).toBe("$249.50");
  });
  it("extracts 15% GST from an inclusive price", () => {
    expect(gstOfCents(24900)).toBe(3248); // $249 × 3/23 = $32.48
    expect(gstOfCents(2300)).toBe(300);
  });
});

describe("package labels", () => {
  const monthly = {
    billing_type: "recurring",
    billing_interval: "month",
    access_weeks: null,
  } as const;
  const quarterly = {
    billing_type: "recurring",
    billing_interval: "quarter",
    access_weeks: null,
  } as const;
  const block = {
    billing_type: "one_time",
    billing_interval: null,
    access_weeks: 12,
  } as const;
  const forever = {
    billing_type: "one_time",
    billing_interval: null,
    access_weeks: null,
  } as const;

  it("per-label", () => {
    expect(perLabel(monthly)).toBe("/ month");
    expect(perLabel(block)).toBe("/ 12 weeks");
    expect(perLabel(forever)).toBe("one-off");
  });
  it("billing line", () => {
    expect(billingLine(monthly)).toBe("Billed monthly, cancel any time");
    expect(billingLine(quarterly)).toBe(
      "Billed every 3 months, cancel any time",
    );
    expect(billingLine(block)).toBe("One payment, 12 weeks of access");
    expect(billingLine(forever)).toBe("One payment, ongoing access");
  });
  it("program meta", () => {
    expect(programMeta({ weeks: 8, session_count: 24 })).toBe(
      "8 weeks, 3 sessions a week",
    );
    expect(programMeta({ weeks: 1, session_count: 1 })).toBe(
      "1 week, 1 session a week",
    );
    expect(programMeta({ weeks: 0, session_count: 5 })).toBe("5 sessions");
    expect(programMeta({ weeks: 6, session_count: 0 })).toBe("6 weeks");
  });
});
