import { describe, expect, it } from "vitest";
import {
  formatMeasurementCompact,
  formatMeasurementSummary,
  measurementInputMode,
  measurementStatColumns,
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

describe("formatMeasurementCompact", () => {
  it("formats reps-based exercises as sets×reps, load omitted", () => {
    expect(
      formatMeasurementCompact({
        sets: 4,
        unit_type: "Reps × Weight (kg)",
        reps: 8,
        value: 60,
      }),
    ).toBe("4×8");
  });

  it("formats duration-based exercises as sets×duration", () => {
    expect(
      formatMeasurementCompact({
        sets: 3,
        unit_type: "Time",
        reps: null,
        value: 20,
      }),
    ).toBe("3×20s");
  });
});

describe("measurementStatColumns", () => {
  it("returns SETS/REPS/LOAD for weighted exercises", () => {
    expect(
      measurementStatColumns({
        sets: 4,
        unit_type: "Reps × Weight (kg)",
        reps: 8,
        value: 32,
      }),
    ).toEqual([
      { label: "SETS", value: "4" },
      { label: "REPS", value: "8" },
      { label: "LOAD", value: "32 kg" },
    ]);
  });

  it("shows BW as load for bodyweight exercises", () => {
    expect(
      measurementStatColumns({
        sets: 2,
        unit_type: "Bodyweight",
        reps: 15,
        value: null,
      }),
    ).toEqual([
      { label: "SETS", value: "2" },
      { label: "REPS", value: "15" },
      { label: "LOAD", value: "BW" },
    ]);
  });

  it("returns SETS/DURATION for time-based exercises", () => {
    expect(
      measurementStatColumns({
        sets: 3,
        unit_type: "Time",
        reps: null,
        value: 45,
      }),
    ).toEqual([
      { label: "SETS", value: "3" },
      { label: "DURATION", value: "45s" },
    ]);
  });
});
