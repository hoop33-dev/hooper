import { describe, expect, it } from "vitest";
import {
  convertUnit,
  defaultUnitFor,
  formatMeasurementCompact,
  formatMeasurementSummary,
  isUnitTypeComboUniform,
  measurementStatColumns,
  unitOptionsFor,
  type Measurement,
} from "./measurementFormat";

/** Builds one unit-type slot's rows across `sets` sets — `values` supplies
 * one value per set (repeat the same number for a uniform placement, vary
 * them for a pyramid/wave one). */
function measurementRows(
  unitType: string,
  values: (number | null)[],
  overrides: Partial<
    Omit<Measurement, "unit_type" | "set_index" | "value">
  > = {},
): Measurement[] {
  return values.map((value, set_index) => ({
    unit_type: unitType,
    set_index,
    value,
    value_entered_by: "coach",
    value_unit: defaultUnitFor(unitType),
    ...overrides,
  }));
}

/** Single-set convenience wrapper for the common "every set is the same"
 * case, mirroring the old single-measurement test fixture. */
function measurement(
  unitType: string,
  overrides: Partial<Omit<Measurement, "unit_type" | "set_index">> = {},
  sets = 1,
): Measurement[] {
  const { value = null, ...rest } = overrides;
  return measurementRows(unitType, Array(sets).fill(value), rest);
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
        measurements: measurement("Reps", { value: 15 }),
      }),
    ).toBe("1 set × 15");
  });

  it("formats weight in whatever unit was selected", () => {
    expect(
      formatMeasurementSummary({
        sets: 4,
        measurements: measurement("Weight", { value: 60 }, 4),
      }),
    ).toBe("4 sets × 60 kg");
    expect(
      formatMeasurementSummary({
        sets: 4,
        measurements: measurement(
          "Weight",
          { value: 132, value_unit: "lbs" },
          4,
        ),
      }),
    ).toBe("4 sets × 132 lbs");
  });

  it("formats time and distance", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: measurement("Time", { value: 20 }, 3),
      }),
    ).toBe("3 sets × 20sec");
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: measurement("Distance", { value: 10 }, 3),
      }),
    ).toBe("3 sets × 10m");
  });

  it("formats % 1RM, RPE, and other plain-number types", () => {
    expect(
      formatMeasurementSummary({
        sets: 5,
        measurements: measurement("% 1RM", { value: 75 }, 5),
      }),
    ).toBe("5 sets × 75%");
    expect(
      formatMeasurementSummary({
        sets: 5,
        measurements: measurement("RPE", { value: 8 }, 5),
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
          ...measurement("Reps", { value: 8 }, 4),
          ...measurement("Weight", { value: 60 }, 4),
        ],
      }),
    ).toBe("4 sets × 8 + 60 kg");
  });

  it("shows an em dash for a field the athlete hasn't entered yet", () => {
    expect(
      formatMeasurementSummary({
        sets: 3,
        measurements: [
          ...measurement("Distance", { value: 100 }, 3),
          ...measurement(
            "Time",
            { value: null, value_entered_by: "athlete" },
            3,
          ),
        ],
      }),
    ).toBe("3 sets × — + 100m");
  });

  it("shows a first→last range for a pyramid/wave set", () => {
    expect(
      formatMeasurementSummary({
        sets: 5,
        measurements: [
          ...measurementRows("Reps", [12, 10, 8, 5, 3]),
          ...measurementRows("Weight", [40, 50, 60, 70, 75]),
        ],
      }),
    ).toBe("5 sets × 12→3 + 40 kg→75 kg");
  });
});

describe("formatMeasurementCompact", () => {
  it("formats a single measurement as sets×value", () => {
    expect(
      formatMeasurementCompact({
        sets: 4,
        measurements: measurement("Reps", { value: 8 }, 4),
      }),
    ).toBe("4×8");
    expect(
      formatMeasurementCompact({
        sets: 3,
        measurements: measurement("Time", { value: 20 }, 3),
      }),
    ).toBe("3×20sec");
  });

  it("joins multiple measurements with a plus sign", () => {
    expect(
      formatMeasurementCompact({
        sets: 3,
        measurements: [
          ...measurement("Distance", { value: 100 }, 3),
          ...measurement(
            "Time",
            { value: null, value_entered_by: "athlete" },
            3,
          ),
        ],
      }),
    ).toBe("3×—+100m");
  });

  it("collapses a pyramid/wave measurement to a terse first-last range", () => {
    expect(
      formatMeasurementCompact({
        sets: 5,
        measurements: [
          ...measurementRows("Reps", [12, 10, 8, 5, 3]),
          ...measurementRows("Weight", [40, 50, 60, 70, 75]),
        ],
      }),
    ).toBe("5×12-3+40-75 kg");
  });

  it("uses an em dash for whichever end of the range the athlete hasn't entered yet", () => {
    expect(
      formatMeasurementCompact({
        sets: 3,
        measurements: measurementRows("Weight", [40, 50, null], {
          value_entered_by: "athlete",
        }),
      }),
    ).toBe("3×40-—");
  });
});

describe("measurementStatColumns", () => {
  it("returns one column per active measurement, labeled by unit type", () => {
    expect(
      measurementStatColumns({
        sets: 4,
        measurements: [
          ...measurement("Reps", { value: 8 }, 4),
          ...measurement("Weight", { value: 32 }, 4),
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
        ...measurement("Distance", { value: 100 }, 3),
        ...measurement("Time", { value: null, value_entered_by: "athlete" }, 3),
      ],
    });
    const keys = columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length); // no duplicate React keys
    expect(columns).toEqual([
      { key: "sets", label: "SETS", value: "3" },
      { key: "Time", label: "TIME", value: "—" },
      { key: "Distance", label: "DISTANCE", value: "100m" },
    ]);
  });
});

/** Set 0 is Shots+Makes, set 1 is Time only — a per-set unit-type combo
 * that no longer agrees across sets, the case formatMeasurementCompact/
 * formatMeasurementSummary/measurementStatColumns fall back to "Custom"/
 * "mixed units" for instead of the normal grouped breakdown. */
function mixedUnitMeasurements(): Measurement[] {
  return [
    {
      unit_type: "Shots",
      set_index: 0,
      value: 10,
      value_entered_by: "coach",
      value_unit: null,
    },
    {
      unit_type: "Makes",
      set_index: 0,
      value: 0,
      value_entered_by: "coach",
      value_unit: null,
    },
    {
      unit_type: "Time",
      set_index: 1,
      value: 45,
      value_entered_by: "coach",
      value_unit: "sec",
    },
  ];
}

describe("isUnitTypeComboUniform", () => {
  it("is true when every set shares the same ordered unit-type combo", () => {
    expect(
      isUnitTypeComboUniform(
        [
          ...measurement("Reps", { value: 8 }, 3),
          ...measurement("Weight", { value: 60 }, 3),
        ],
        3,
      ),
    ).toBe(true);
  });

  it("is false when a set's unit-type combo differs from set 0's", () => {
    expect(isUnitTypeComboUniform(mixedUnitMeasurements(), 2)).toBe(false);
  });

  it("is true for zero sets or no measurements at all", () => {
    expect(isUnitTypeComboUniform([], 0)).toBe(true);
    expect(isUnitTypeComboUniform([], 3)).toBe(true);
  });
});

describe("formatMeasurementCompact — non-uniform sets", () => {
  it("falls back to sets×Custom once unit types differ per set", () => {
    expect(
      formatMeasurementCompact({
        sets: 2,
        measurements: mixedUnitMeasurements(),
      }),
    ).toBe("2×Custom");
  });
});

describe("formatMeasurementSummary — non-uniform sets", () => {
  it("falls back to sets · mixed units once unit types differ per set", () => {
    expect(
      formatMeasurementSummary({
        sets: 2,
        measurements: mixedUnitMeasurements(),
      }),
    ).toBe("2 sets · mixed units");
  });
});

describe("measurementStatColumns — non-uniform sets", () => {
  it("collapses to a SETS column plus a single Custom column", () => {
    expect(
      measurementStatColumns({
        sets: 2,
        measurements: mixedUnitMeasurements(),
      }),
    ).toEqual([
      { key: "sets", label: "SETS", value: "2" },
      { key: "custom", label: "", value: "Custom" },
    ]);
  });
});
