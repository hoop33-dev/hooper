import { sortUnitTypes } from "@/src/constants/unitTypes";
import type { EnteredBy } from "@hooper/db";

// One row: a single unit-type slot's value for a single set. A placement
// with N sets holds N of these per unit-type slot (Reps, Weight, ...), which
// is what lets a pyramid/wave set carry a distinct value per set instead of
// one value applied uniformly across all of them.
export type Measurement = {
  unit_type: string;
  set_index: number;
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
// (Reps, Reps Each Side, RPE, RIR, Shots, Makes, % 1RM) are plain numbers
// with no switchable unit.
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

/** One unit-type slot's values across every set, in set order — the shape
 * the display helpers below actually render, built by grouping a
 * placement's flat per-set measurement rows. */
type GroupedMeasurement = {
  unit_type: string;
  value_unit: string | null;
  values: { value: number | null; value_entered_by: EnteredBy }[];
};

/** Groups flat per-set measurement rows by unit-type slot, each slot's
 * values sorted into set order — independent of the input array's order, so
 * callers don't have to pre-sort. Slot order in the result follows the
 * canonical unit-type priority (see sortUnitTypes), not appearance order. */
function groupByUnitType(measurements: Measurement[]): GroupedMeasurement[] {
  const order: string[] = [];
  const map = new Map<string, Measurement[]>();
  for (const m of measurements) {
    if (!map.has(m.unit_type)) order.push(m.unit_type);
    const rows = map.get(m.unit_type) ?? [];
    rows.push(m);
    map.set(m.unit_type, rows);
  }
  return sortUnitTypes(order).map((unitType) => {
    const rows = [...map.get(unitType)!].sort(
      (a, b) => a.set_index - b.set_index,
    );
    return {
      unit_type: unitType,
      value_unit: rows[0].value_unit,
      values: rows.map((r) => ({
        value: r.value,
        value_entered_by: r.value_entered_by,
      })),
    };
  });
}

/** The unit to display/store alongside a value: whatever was explicitly
 * chosen, falling back to the unit type's default, or "%" for % 1RM. */
function displayUnit(m: GroupedMeasurement): string {
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
function formatSetValue(
  value: number | null,
  unit: string,
  hug: boolean,
): string {
  if (value == null) return "—";
  return formatWithUnit(value, unit, hug);
}

/** A unit-type slot's values across every set, collapsed to one string: the
 * plain value when every set shares it ("60 kg"), or a first→last range
 * once they diverge ("40 kg→75 kg") — the full session view has the room
 * to spell out the unit on both ends. */
function measurementPart(m: GroupedMeasurement): string {
  const unit = displayUnit(m);
  const hug = HUGGING_UNIT_TYPES.has(m.unit_type);
  const rendered = m.values.map((v) => formatSetValue(v.value, unit, hug));
  const uniform = new Set(rendered).size <= 1;
  if (uniform) return rendered[0] ?? "—";
  return `${rendered[0]}→${rendered[rendered.length - 1]}`;
}

/** The compact sibling of measurementPart: a pyramid/wave measurement
 * becomes a terse "12-5kg"/"60-30sec"/"3-5" range — first value bare, unit
 * only on the last — instead of repeating the unit on both ends, since the
 * dense program-canvas row doesn't have room for that. */
function measurementPartCompact(m: GroupedMeasurement): string {
  const unit = displayUnit(m);
  const hug = HUGGING_UNIT_TYPES.has(m.unit_type);
  const rendered = m.values.map((v) => formatSetValue(v.value, unit, hug));
  const uniform = new Set(rendered).size <= 1;
  if (uniform) return rendered[0] ?? "—";
  const first = m.values[0]?.value;
  const firstText = first == null ? "—" : `${first}`;
  const lastText = formatSetValue(
    m.values[m.values.length - 1]?.value ?? null,
    unit,
    hug,
  );
  return `${firstText}-${lastText}`;
}

/**
 * Human-readable summary of a placed exercise's measurements, e.g.
 * "4 sets × 8 + 60 kg", "3 sets × 20sec", "3 sets × 100m + —" (Sprint with
 * Distance coach-entered and Time left for the athlete to log), or
 * "5 sets × 12→3 + 40 kg→75 kg" for a pyramid set.
 */
export function formatMeasurementSummary(m: MeasurementsFields): string {
  const setsLabel = `${m.sets} set${m.sets === 1 ? "" : "s"}`;
  const grouped = groupByUnitType(m.measurements);
  if (grouped.length === 0) return setsLabel;
  return `${setsLabel} × ${grouped.map(measurementPart).join(" + ")}`;
}

/**
 * Dense one-line summary for the program canvas's compact rows, e.g.
 * "4×8", "2×15", "3×20sec+100m" — sets × each active measurement, or
 * "4×12-5kg" for a pyramid/wave measurement (see measurementPartCompact).
 */
export function formatMeasurementCompact(m: MeasurementsFields): string {
  const grouped = groupByUnitType(m.measurements);
  return `${m.sets}×${grouped.map(measurementPartCompact).join("+")}`;
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
  const rest = groupByUnitType(m.measurements).map((g) => ({
    key: g.unit_type,
    label: g.unit_type.toUpperCase(),
    value: measurementPart(g),
  }));
  return [sets, ...rest];
}
