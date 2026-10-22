import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import type { AthleteBlockExercise, AthleteSessionDetail } from "@hooper/api";
import type { BlockExerciseMeasurementRow, EnteredBy } from "@hooper/db";

import { groupSetsByVariant } from "./blockExerciseDisplay";

/** Default unit per switchable unit type — mirrors the first entry of each
 * family in apps/web/src/lib/measurementFormat.ts's UNIT_FAMILIES (that
 * file isn't importable from mobile). */
const DEFAULT_UNIT: Record<string, string> = {
  Weight: "kg",
  Distance: "m",
  Time: "sec",
};

// "%", "sec"/"min"/"hr", and "m"/"km" hug the number ("75%", "20sec",
// "100m"); "kg"/"lbs"/"g" get a space ("60 kg"); no unit at all (Reps, RPE,
// Shots, Makes) is just the bare number.
const HUGGING_UNIT_TYPES = new Set(["% 1RM", "Time", "Distance"]);

// Units live per set, so a slot can mix them ("1000m→1km").
type GroupedMeasurement = {
  unitType: string;
  values: { value: number | null; unit: string; enteredBy: EnteredBy }[];
};

function displayUnit(unitType: string, valueUnit: string | null): string {
  if (unitType === "% 1RM") return "%";
  if (unitType === "Reps Each Side") return "/side";
  return valueUnit ?? DEFAULT_UNIT[unitType] ?? "";
}

/** One unit-type slot's values across the given sets, in set order, slots
 * in the canonical unit-type priority order. */
function groupByUnitType(
  rows: BlockExerciseMeasurementRow[],
): GroupedMeasurement[] {
  const byType = new Map<string, BlockExerciseMeasurementRow[]>();
  for (const row of sortByUnitTypePriority(rows)) {
    const list = byType.get(row.unit_type) ?? [];
    list.push(row);
    byType.set(row.unit_type, list);
  }
  return [...byType.entries()].map(([unitType, list]) => {
    const sorted = [...list].sort((a, b) => a.set_index - b.set_index);
    return {
      unitType,
      values: sorted.map((r) => ({
        value: r.value,
        unit: displayUnit(unitType, r.value_unit),
        enteredBy: r.value_entered_by,
      })),
    };
  });
}

/** The coach's value for a set, or null when the athlete logs it themselves
 * — either no value at all, or one left over after the slot was switched to
 * athlete-entered (matches apps/web/src/lib/programExport.ts). */
function coachValue(v: GroupedMeasurement["values"][number]): number | null {
  return v.enteredBy === "athlete" ? null : v.value;
}

/** An athlete-entered value is shown as a dash. */
function formatValue(
  v: GroupedMeasurement["values"][number],
  unitType: string,
): string {
  const value = coachValue(v);
  const { unit } = v;
  if (value == null) return "—";
  if (!unit) return `${value}`;
  const hug = HUGGING_UNIT_TYPES.has(unitType) || unit === "/side";
  return hug ? `${value}${unit}` : `${value} ${unit}`;
}

/** Whether the values only ever rise or only ever fall. A dash (athlete-
 * entered) has no direction, so only the known values are judged. */
function isOneWay(values: (number | null)[]): boolean {
  const nums = values.filter((v): v is number => v != null);
  const rising = nums.every((v, i) => i === 0 || v >= nums[i - 1]!);
  const falling = nums.every((v, i) => i === 0 || v <= nums[i - 1]!);
  return rising || falling;
}

/** The slot's value when every set shares it ("60 kg"); a first→last range
 * for a pyramid that only moves one way ("40 kg→75 kg"); otherwise every
 * value in order, repeats collapsed, so a wave's turn isn't hidden
 * ("40 kg→75 kg→40 kg"). */
function measurementPart(m: GroupedMeasurement): string {
  const steps: { text: string; value: number | null }[] = [];
  for (const v of m.values) {
    const text = formatValue(v, m.unitType);
    if (steps[steps.length - 1]?.text !== text)
      steps.push({ text, value: coachValue(v) });
  }
  if (steps.length <= 1) return steps[0]?.text ?? "—";
  if (isOneWay(steps.map((s) => s.value)))
    return `${steps[0]!.text}→${steps[steps.length - 1]!.text}`;
  return steps.map((s) => s.text).join("→");
}

function isComboUniform(
  rows: BlockExerciseMeasurementRow[],
  setIndices: number[],
): boolean {
  const combos = setIndices.map((setIndex) =>
    sortByUnitTypePriority(rows.filter((r) => r.set_index === setIndex))
      .map((r) => r.unit_type)
      .join("|"),
  );
  return new Set(combos).size <= 1;
}

/**
 * One-line prescription for (a variant group of) a placed exercise, e.g.
 * "4 × 8, 32 kg", "3 × 20sec", "5 × 12→3, 40 kg→75 kg". In a superset the
 * round count lives on the block, so it's left off: "8 reps, 32 kg". Null
 * when there's nothing to say (a superset exercise with no measurements).
 */
export function formatPrescription(
  be: AthleteBlockExercise,
  setIndices: number[],
  superset: boolean,
): string | null {
  const sets = setIndices.length;
  const setsLabel = `${sets} set${sets === 1 ? "" : "s"}`;
  const rows = be.measurements.filter((m) => setIndices.includes(m.set_index));
  if (!isComboUniform(rows, setIndices))
    return superset ? "Mixed units" : `${setsLabel}, mixed units`;

  const parts = groupByUnitType(rows).map((g) => ({
    unitType: g.unitType,
    text: measurementPart(g),
  }));
  const [first, ...rest] = parts;
  if (!first) return superset ? null : setsLabel;

  const head = superset
    ? first.unitType === "Reps"
      ? `${first.text} reps`
      : first.text
    : `${sets} × ${first.text}`;
  return [head, ...rest.map((p) => p.text)].join(", ");
}

/** Session-level counts for the preview's stats strip. Exercises count each
 * variant group separately, matching how the session player lists them. */
export function sessionTotals(session: AthleteSessionDetail): {
  blocks: number;
  exercises: number;
  sets: number;
} {
  const placements = session.blocks.flatMap((b) => b.exercises);
  return {
    blocks: session.blocks.length,
    exercises: placements.reduce(
      (n, be) => n + groupSetsByVariant(be).length,
      0,
    ),
    sets: placements.reduce((n, be) => n + be.sets, 0),
  };
}
