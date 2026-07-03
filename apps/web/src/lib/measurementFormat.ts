import type { EnteredBy } from "@hooper/db";

export type Measurement = {
  unit_type: string;
  value: number | null;
  value_entered_by: EnteredBy;
  value_unit: string | null;
};

export type MeasurementsFields = {
  sets: number;
  measurements: Measurement[];
};

// Each family's units convert through a shared base unit (perBase = how many
// base units make up one of `unit`), so switching a field's unit can convert
// the number instead of just relabeling it. Unit types outside this map
// (Reps, Reps Each Side, RPE, Shots, Makes, % 1RM) are plain numbers with no
// switchable unit.
type UnitDef = { unit: string; perBase: number };

const UNIT_FAMILIES: Record<string, UnitDef[]> = {
  Weight: [
    { unit: "kg", perBase: 1 },
    { unit: "lbs", perBase: 0.45359237 },
    { unit: "g", perBase: 0.001 },
  ],
  Distance: [
    { unit: "m", perBase: 1 },
    { unit: "km", perBase: 1000 },
  ],
  Time: [
    { unit: "sec", perBase: 1 },
    { unit: "min", perBase: 60 },
    { unit: "hr", perBase: 3600 },
  ],
};

/** The switchable units for a unit type, or null if it doesn't have any. */
export function unitOptionsFor(unitType: string): string[] | null {
  return UNIT_FAMILIES[unitType]?.map((u) => u.unit) ?? null;
}

export function defaultUnitFor(unitType: string): string | null {
  return UNIT_FAMILIES[unitType]?.[0]?.unit ?? null;
}

/** Converts a number between two units in the same family, rounding to 2
 * decimal places to avoid float noise. Returns `value` unchanged if either
 * unit isn't recognized for this unit type. */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  unitType: string,
): number {
  const family = UNIT_FAMILIES[unitType];
  const from = family?.find((u) => u.unit === fromUnit)?.perBase;
  const to = family?.find((u) => u.unit === toUnit)?.perBase;
  if (from == null || to == null) return value;
  return Math.round(((value * from) / to) * 100) / 100;
}

/** The unit to display/store alongside a value: whatever was explicitly
 * chosen, falling back to the unit type's default, or "%" for % 1RM. */
function displayUnit(m: Measurement): string {
  if (m.unit_type === "% 1RM") return "%";
  return m.value_unit ?? defaultUnitFor(m.unit_type) ?? "";
}

// "%", "sec"/"min"/"hr", and "m"/"km" hug the number ("75%", "20sec",
// "100m"); "kg"/"lbs"/"g" get a space ("60 kg"); no unit at all (Reps, RPE,
// Shots, Makes) is just the bare number.
const HUGGING_UNIT_TYPES = new Set(["% 1RM", "Time", "Distance"]);

function formatWithUnit(value: number, unit: string, hug: boolean): string {
  if (!unit) return `${value}`;
  return hug ? `${value}${unit}` : `${value} ${unit}`;
}

/** A measurement's value is only ever null when the athlete (not the coach)
 * is meant to fill it in, so null always renders as a pending em dash. */
function measurementPart(m: Measurement): string {
  if (m.value == null) return "—";
  return formatWithUnit(
    m.value,
    displayUnit(m),
    HUGGING_UNIT_TYPES.has(m.unit_type),
  );
}

/**
 * Human-readable summary of a placed exercise's measurements, e.g.
 * "4 sets × 8 + 60 kg", "3 sets × 20sec", "3 sets × 100m + —" (Sprint with
 * Distance coach-entered and Time left for the athlete to log).
 */
export function formatMeasurementSummary(m: MeasurementsFields): string {
  const setsLabel = `${m.sets} set${m.sets === 1 ? "" : "s"}`;
  if (m.measurements.length === 0) return setsLabel;
  return `${setsLabel} × ${m.measurements.map(measurementPart).join(" + ")}`;
}

/**
 * Dense one-line summary for the program canvas's compact rows, e.g.
 * "4×8", "2×15", "3×20sec+100m" — sets × each active measurement.
 */
export function formatMeasurementCompact(m: MeasurementsFields): string {
  return `${m.sets}×${m.measurements.map(measurementPart).join("+")}`;
}

export type MeasurementStatColumn = {
  key: string;
  label: string;
  value: string;
};

/**
 * The session editor's per-row stat columns (SETS plus one column per active
 * measurement, e.g. SETS / REPS / WEIGHT, or SETS / DISTANCE / TIME).
 */
export function measurementStatColumns(
  m: MeasurementsFields,
): MeasurementStatColumn[] {
  const sets: MeasurementStatColumn = {
    key: "sets",
    label: "SETS",
    value: `${m.sets}`,
  };
  const rest = m.measurements.map((meas) => ({
    key: meas.unit_type,
    label: meas.unit_type.toUpperCase(),
    value: measurementPart(meas),
  }));
  return [sets, ...rest];
}
