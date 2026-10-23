import { describe, expect, it } from "vitest";
import {
  formatProgramSub,
  formatSessionsPerWeek,
  formatShortDate,
  plural,
} from "./format";

describe("plural", () => {
  it("uses the singular for exactly one", () => {
    expect(plural(1, "program")).toBe("1 program");
    expect(plural(0, "program")).toBe("0 programs");
    expect(plural(2, "coach", "coaches")).toBe("2 coaches");
  });
});

describe("formatShortDate", () => {
  it("formats as short month, day, year in NZ time", () => {
    expect(formatShortDate("2026-09-30T00:00:00Z")).toBe("Sep 30, 2026");
  });

  it("uses the NZ day whatever the runtime's zone", () => {
    // 20:00 UTC on Nov 30 is already Dec 1 in Auckland.
    expect(formatShortDate("2026-11-30T20:00:00Z")).toBe("Dec 1, 2026");
  });
});

describe("formatSessionsPerWeek / formatProgramSub", () => {
  it("formats ranges and empty programs", () => {
    expect(formatSessionsPerWeek([3, 3])).toBe("3/wk");
    expect(formatSessionsPerWeek([2, 4])).toBe("2-4/wk");
    expect(formatSessionsPerWeek(null)).toBe("no sessions yet");
    expect(formatProgramSub({ weeks: 8, sessionsPerWeek: [3, 3] })).toBe(
      "8 wk · 3/wk",
    );
  });
});
