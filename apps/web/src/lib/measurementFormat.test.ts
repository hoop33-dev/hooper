import { describe, expect, it } from "vitest";
import {
  convertUnit,
  defaultUnitFor,
  formatMeasurementCompact,
  formatMeasurementSummary,
  measurementStatColumns,
  unitOptionsFor,
  type Measurement,
} from "./measurementFormat";

function measurement(
  unitType: string,
  overrides: Partial<Measurement> = {},
): Measurement {
  return {
    unit_type: unitType,
    value: null,
    value_entered_by: "coach",
    value_unit: defaultUnitFor(unitType),
    ...overrides,
  };
}

describe("unitOptionsFor / defaultUnitFor", () => {
  it("returns the switchable units for weight, distance, and time", () => {
    expect(unitOptionsFor("Weight")).toEqual(["kg", "lbs", "g"]);
    expect(unitOptionsFor("Distance")).toEqual(["m", "km"]);
    expect(unitOptionsFor("Time")).toEqual(["sec", "min", "hr"]);
  });

  it("returns null for unit types with no switchable unit", () => {
    expect(unitOptionsFor("Reps")).toBeNull();
    expect(unitOptionsFor("Reps Each Side")).toBeNull();
    expect(unitOptionsFor("RPE")).toBeNull();
    expect(unitOptionsFor("Shots")).toBeNull();
    expect(unitOptionsFor("Makes")).toBeNull();
    expect(unitOptionsFor("% 1RM")).toBeNull();
  });

  it("defaults to the first option in each family", () => {
    expect(defaultUnitFor("Weight")).toBe("kg");
    expect(defaultUnitFor("Distance")).toBe("m");
    expect(defaultUnitFor("Time")).toBe("sec");
    expect(defaultUnitFor("Reps")).toBeNull();
  });
});

describe("convertUnit", () => {
  it("converts weight between kg, lbs, and g", () => {
    expect(convertUnit(100, "kg", "lbs", "Weight")).toBeCloseTo(220.46, 1);
    expect(convertUnit(220.46, "lbs", "kg", "Weight")).toBeCloseTo(100, 1);
    expect(convertUnit(1, "kg", "g", "Weight")).toBe(1000);
  });

  it("converts distance between m and km", () => {
    expect(convertUnit(1500, "m", "km", "Distance")).toBe(1.5);
    expect(convertUnit(1.5, "km", "m", "Distance")).toBe(1500);
  });

  it("converts time between sec, min, and hr", () => {
    expect(convertUnit(90, "sec", "min", "Time")).toBe(1.5);
    expect(convertUnit(2, "hr", "min", "Time")).toBe(120);
  });

  it("returns the value unchanged for unrecognized units", () => {
    expect(convertUnit(10, "kg", "banana", "Weight")).toBe(10);
    expect(convertUnit(10, "reps", "reps", "Reps")).toBe(10);
  });
});

describe("formatMeasurementSummary", () => {
  it("formats a single reps-only measurement with singular set", () => {
    expect(
      formatMeasurementSummary({
        sets: 1,
        measurements: [measurement("Reps", { value: 15 })],
      }),
    ).toBe("1 set × 15");
  });

  it("formats weight in whatever unit was selected", () => {
    expect(
      formatMeasurementSummary({
        sets: 4,
        measurements: [measurement("Weight", { value: 60 })],
      }),
    ).toBe("4 sets × 60 kg");
    expect(
      formatMeasurementSummary({
        sets: 4,
        measurements: [
          measurement("Weight", { value: 132, value_unit: "lbs" }),
        ],
      }),
    ).toBe("4 sets × 132 lbs");
  });

  it("formats time and distance", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: [measurement("Time", { value: 20 })],
      }),
    ).toBe("3 sets × 20sec");
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: [measurement("Distance", { value: 10 })],
      }),
    ).toBe("3 sets × 10m");
  });

  it("formats % 1RM, RPE, and other plain-number types", () => {
    expect(
      formatMeasurementSummary({
        sets: 5,
        measurements: [measurement("% 1RM", { value: 75 })],
      }),
    ).toBe("5 sets × 75%");
    expect(
      formatMeasurementSummary({
        sets: 5,
        measurements: [measurement("RPE", { value: 8 })],
      }),
    ).toBe("5 sets × 8");
  });

  it("falls back to sets only when there are no active measurements", () => {
    expect(formatMeasurementSummary({ sets: 3, measurements: [] })).toBe(
      "3 sets",
    );
  });

  it("joins independent measurements together, e.g. Reps + Weight", () => {
    expect(
      formatMeasurementSummary({
        sets: 4,
        measurements: [
          measurement("Reps", { value: 8 }),
          measurement("Weight", { value: 60 }),
        ],
      }),
    ).toBe("4 sets × 8 + 60 kg");
  });

  it("shows an em dash for a field the athlete hasn't entered yet", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: [
          measurement("Distance", { value: 100 }),
          measurement("Time", { value: null, value_entered_by: "athlete" }),
        ],
      }),
    ).toBe("3 sets × 100m + —");
  });
});

describe("formatMeasurementCompact", () => {
  it("formats a single measurement as sets×value", () => {
    expect(
      formatMeasurementCompact({
        sets: 4,
        measurements: [measurement("Reps", { value: 8 })],
      }),
    ).toBe("4×8");
    expect(
      formatMeasurementCompact({
        sets: 3,
        measurements: [measurement("Time", { value: 20 })],
      }),
    ).toBe("3×20sec");
  });

  it("joins multiple measurements with a plus sign", () => {
    expect(
      formatMeasurementCompact({
        sets: 3,
        measurements: [
          measurement("Distance", { value: 100 }),
          measurement("Time", { value: null, value_entered_by: "athlete" }),
        ],
      }),
    ).toBe("3×100m+—");
  });
});

describe("measurementStatColumns", () => {
  it("returns one column per active measurement, labeled by unit type", () => {
    expect(
      measurementStatColumns({
        sets: 4,
        measurements: [
          measurement("Reps", { value: 8 }),
          measurement("Weight", { value: 32 }),
        ],
      }),
    ).toEqual([
      { key: "sets", label: "SETS", value: "4" },
      { key: "Reps", label: "REPS", value: "8" },
      { key: "Weight", label: "WEIGHT", value: "32 kg" },
    ]);
  });

  it("uses distinct keys and labels for Distance and Time shown together", () => {
    const columns = measurementStatColumns({
      sets: 3,
      measurements: [
        measurement("Distance", { value: 100 }),
        measurement("Time", { value: null, value_entered_by: "athlete" }),
      ],
    });
    const keys = columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length); // no duplicate React keys
    expect(columns).toEqual([
      { key: "sets", label: "SETS", value: "3" },
      { key: "Distance", label: "DISTANCE", value: "100m" },
      { key: "Time", label: "TIME", value: "—" },
    ]);
  });
});
