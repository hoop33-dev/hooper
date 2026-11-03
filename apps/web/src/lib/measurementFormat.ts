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
  // Units live per set, so a slot can mix them ("1000m→1km").
  values: {
    value: number | null;
    value_entered_by: EnteredBy;
    value_unit: string | null;
  }[];
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
      values: rows.map((r) => ({
        value: r.value,
        value_entered_by: r.value_entered_by,
        value_unit: r.value_unit,
      })),
    };
  });
}

/** The unit to display/store alongside a value: whatever was explicitly
 * chosen, falling back to the unit type's default, or "%" for % 1RM. */
function displayUnit(unitType: string, valueUnit: string | null): string {
  if (unitType === "% 1RM") return "%";
  return valueUnit ?? defaultUnitFor(unitType) ?? "";
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

type Step = { value: number | null; unit: string; text: string };

/** A slot's per-set values rendered in set order, with consecutive repeats
 * collapsed — [40, 40, 75] becomes two steps, "40 kg" then "75 kg". */
function renderSteps(m: GroupedMeasurement): Step[] {
  const hug = HUGGING_UNIT_TYPES.has(m.unit_type);
  const steps: Step[] = [];
  for (const v of m.values) {
    const unit = displayUnit(m.unit_type, v.value_unit);
    const text = formatSetValue(v.value, unit, hug);
    if (steps[steps.length - 1]?.text !== text)
      steps.push({ value: v.value, unit, text });
  }
  return steps;
}

/** Whether the steps only ever rise or only ever fall — a plain pyramid,
 * which a first/last range describes fully; a wave (40→75→40) doesn't. A
 * pending "—" has no direction, so only the known values are judged. */
function isOneWay(steps: Step[]): boolean {
  const nums = steps.flatMap((s) => (s.value == null ? [] : [s.value]));
  const rising = nums.every((v, i) => i === 0 || v >= nums[i - 1]!);
  const falling = nums.every((v, i) => i === 0 || v <= nums[i - 1]!);
  return rising || falling;
}

/** A unit-type slot's values across every set, collapsed to one string: the
 * plain value when every set shares it ("60 kg"), a first→last range for a
 * pyramid that only moves one way ("40 kg→75 kg"), or every value in order
 * for a wave ("40 kg→75 kg→40 kg") — the full session view has the room to
 * spell out the unit on each value. */
function measurementPart(m: GroupedMeasurement): string {
  const steps = renderSteps(m);
  if (steps.length <= 1) return steps[0]?.text ?? "—";
  const shown = isOneWay(steps) ? [steps[0]!, steps[steps.length - 1]!] : steps;
  return shown.map((s) => s.text).join("→");
}

/** The compact sibling of measurementPart: a pyramid/wave measurement
 * becomes a terse "12-5kg"/"60-30sec"/"3-5"/"40-75-40kg" range — values
 * bare, unit only on the last — instead of repeating the unit on each,
 * since the dense program-canvas row doesn't have room for that. Every value
 * keeps its unit when the slot mixes units ("1000m-1km"). */
function measurementPartCompact(m: GroupedMeasurement): string {
  const steps = renderSteps(m);
  if (steps.length <= 1) return steps[0]?.text ?? "—";
  const shown = isOneWay(steps) ? [steps[0]!, steps[steps.length - 1]!] : steps;
  const last = shown[shown.length - 1]!;
  const mixedUnits = shown.some((s) => s.unit !== last.unit);
  return shown
    .map((s, i) =>
      i === shown.length - 1 || mixedUnits || s.value == null
        ? s.text
        : `${s.value}`,
    )
    .join("-");
}

/** Each set's ordered list of unit types, built from the flat measurement
 * rows — a set with no rows at all is an empty list. */
function unitTypeComboPerSet(
  measurements: Measurement[],
  setsCount: number,
): string[][] {
  const bySet = new Map<number, Measurement[]>();
  for (const m of measurements) {
    const list = bySet.get(m.set_index) ?? [];
    list.push(m);
    bySet.set(m.set_index, list);
  }
  return Array.from({ length: setsCount }, (_, setIndex) =>
    (bySet.get(setIndex) ?? [])
      .slice()
      .sort((a, b) => a.set_index - b.set_index)
      .map((m) => m.unit_type),
  );
}

/**
 * Whether every set shares the identical ordered combo of unit types — once
 * a placement's sets can each independently choose their own unit types
 * (up to 3), a pyramid-style per-slot summary only makes sense while every
 * set still agrees on which slots exist at all.
 */
export function isUnitTypeComboUniform(
  measurements: Measurement[],
  setsCount: number,
): boolean {
  const combos = unitTypeComboPerSet(measurements, setsCount);
  const [first, ...rest] = combos;
  if (!first) return true;
  const firstKey = first.join("|");
  return rest.every((combo) => combo.join("|") === firstKey);
}

/**
 * Human-readable summary of a placed exercise's measurements, e.g.
 * "4 sets × 8 + 60 kg", "3 sets × 20sec", "3 sets × 100m + —" (Sprint with
 * Distance coach-entered and Time left for the athlete to log), or
 * "5 sets × 12→3 + 40 kg→75 kg" for a pyramid set — or "4 sets · mixed
 * units" once the sets no longer share the same unit-type combo at all.
 */
export function formatMeasurementSummary(m: MeasurementsFields): string {
  const setsLabel = `${m.sets} set${m.sets === 1 ? "" : "s"}`;
  if (!isUnitTypeComboUniform(m.measurements, m.sets))
    return `${setsLabel} · mixed units`;
  const grouped = groupByUnitType(m.measurements);
  if (grouped.length === 0) return setsLabel;
  return `${setsLabel} × ${grouped.map(measurementPart).join(" + ")}`;
}

/**
 * Dense one-line summary for the program canvas's compact rows, e.g.
 * "4×8", "2×15", "3×20sec+100m" — sets × each active measurement, or
 * "4×12-5kg" for a pyramid/wave measurement (see measurementPartCompact) —
 * or "4×Custom" once the sets no longer share the same unit-type combo.
 */
export function formatMeasurementCompact(m: MeasurementsFields): string {
  if (!isUnitTypeComboUniform(m.measurements, m.sets))
    return `${m.sets}×Custom`;
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
 * measurement, e.g. SETS / REPS / WEIGHT, or SETS / DISTANCE / TIME) — or
 * SETS plus a single "Custom" column once the sets no longer share the same
 * unit-type combo.
 */
export function measurementStatColumns(
  m: MeasurementsFields,
): MeasurementStatColumn[] {
  const sets: MeasurementStatColumn = {
    key: "sets",
    label: "SETS",
    value: `${m.sets}`,
  };
  if (!isUnitTypeComboUniform(m.measurements, m.sets))
    return [sets, { key: "custom", label: "", value: "Custom" }];
  const rest = groupByUnitType(m.measurements).map((g) => ({
    key: g.unit_type,
    label: g.unit_type.toUpperCase(),
    value: measurementPart(g),
  }));
  return [sets, ...rest];
}
