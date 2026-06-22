import { ageFromDob } from "@/src/lib/age";

describe("ageFromDob", () => {
  // Freeze "today" at 2026-06-22 so age maths are deterministic. Fake timers
  // pin `new Date()`/Date.now() while leaving `new Date(dob)` parsing intact.
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-22T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns null for nullish input", () => {
    expect(ageFromDob(null)).toBeNull();
    expect(ageFromDob(undefined)).toBeNull();
    expect(ageFromDob("")).toBeNull();
  });

  it("returns null for an unparseable date", () => {
    expect(ageFromDob("not-a-date")).toBeNull();
  });

  it("computes whole years for a birthday already passed this year", () => {
    expect(ageFromDob("2000-01-01")).toBe(26);
  });

  it("does not count a birthday that has not occurred yet this year", () => {
    // Birthday is later in 2026 (December), so still 15.
    expect(ageFromDob("2010-12-31")).toBe(15);
  });

  it("counts the birthday on the exact day it occurs", () => {
    expect(ageFromDob("2010-06-22")).toBe(16);
  });

  it("returns null for a future date of birth", () => {
    expect(ageFromDob("2030-01-01")).toBeNull();
  });
});
