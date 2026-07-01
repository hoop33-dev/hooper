import { describe, expect, it } from "vitest";
import {
  formatMeasurementSummary,
  measurementInputMode,
  weightUnitLabel,
} from "./measurementFormat";

describe("measurementInputMode", () => {
  it("maps unit types to input modes", () => {
    expect(measurementInputMode("Time")).toBe("duration");
    expect(measurementInputMode("Distance")).toBe("duration");
    expect(measurementInputMode("Reps × Weight (kg)")).toBe("reps-weight");
    expect(measurementInputMode("Reps × Weight (lbs)")).toBe("reps-weight");
    expect(measurementInputMode("% 1RM")).toBe("reps-percent");
    expect(measurementInputMode("Reps")).toBe("reps-only");
    expect(measurementInputMode("Bodyweight")).toBe("reps-only");
  });
});

describe("weightUnitLabel", () => {
  it("returns the correct suffix for weight unit types", () => {
    expect(weightUnitLabel("Reps × Weight (kg)")).toBe("kg");
    expect(weightUnitLabel("Reps × Weight (lbs)")).toBe("lbs");
    expect(weightUnitLabel("Reps")).toBe("");
  });
});

describe("formatMeasurementSummary", () => {
  it("formats reps + weight", () => {
    expect(
      formatMeasurementSummary({
        sets: 4,
        unit_type: "Reps × Weight (kg)",
        reps: 8,
        value: 60,
      }),
    ).toBe("4 sets × 8 @ 60 kg");
  });

  it("formats time-based exercises without reps", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        unit_type: "Time",
        reps: null,
        value: 20,
      }),
    ).toBe("3 sets × 20s");
  });

  it("formats distance-based exercises", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        unit_type: "Distance",
        reps: null,
        value: 10,
      }),
    ).toBe("3 sets × 10m");
  });

  it("formats % 1RM", () => {
    expect(
      formatMeasurementSummary({
        sets: 5,
        unit_type: "% 1RM",
        reps: 5,
        value: 75,
      }),
    ).toBe("5 sets × 5 @ 75%");
  });

  it("formats plain reps with singular set", () => {
    expect(
      formatMeasurementSummary({
        sets: 1,
        unit_type: "Reps",
        reps: 15,
        value: null,
      }),
    ).toBe("1 set × 15");
  });

  it("falls back to sets only when no reps/value present", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        unit_type: "Bodyweight",
        reps: null,
        value: null,
      }),
    ).toBe("3 sets");
  });
});
