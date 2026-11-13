import { describe, expect, it } from "vitest";
import {
  exceedsMaxDuration,
  formatDuration,
  MAX_VIDEO_DURATION_SECONDS,
} from "./videoDuration";

describe("formatDuration", () => {
  it("formats whole minutes and seconds as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(125)).toBe("2:05");
  });

  it("rounds fractional seconds", () => {
    expect(formatDuration(59.6)).toBe("1:00");
  });

  it("floors negative or zero durations at 0:00", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("exceedsMaxDuration", () => {
  it("is false at and under the 2 minute limit", () => {
    expect(exceedsMaxDuration(MAX_VIDEO_DURATION_SECONDS)).toBe(false);
    expect(exceedsMaxDuration(90)).toBe(false);
  });

  it("is true over the limit", () => {
    expect(exceedsMaxDuration(MAX_VIDEO_DURATION_SECONDS + 1)).toBe(true);
  });

  it("is false for non-finite durations (metadata unavailable)", () => {
    expect(exceedsMaxDuration(NaN)).toBe(false);
    expect(exceedsMaxDuration(Infinity)).toBe(false);
  });
});
