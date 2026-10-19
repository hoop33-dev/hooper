import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import type { AthleteBlockExercise, AthleteSessionDetail } from "@hooper/api";
import type { BlockExerciseMeasurementRow } from "@hooper/db";

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

type GroupedMeasurement = {
  unitType: string;
  unit: string;
  values: (number | null)[];
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
      unit: displayUnit(unitType, sorted[0]!.value_unit),
      values: sorted.map((r) => r.value),
    };
  });
}

/** A null value is one the athlete logs themselves — shown as a dash. */
function formatValue(value: number | null, m: GroupedMeasurement): string {
  if (value == null) return "—";
  if (!m.unit) return `${value}`;
  const hug = HUGGING_UNIT_TYPES.has(m.unitType) || m.unit === "/side";
  return hug ? `${value}${m.unit}` : `${value} ${m.unit}`;
}

/** The slot's value when every set shares it ("60 kg"), else a first→last
 * range for a pyramid/wave ("40 kg→75 kg"). */
function measurementPart(m: GroupedMeasurement): string {
  const rendered = m.values.map((v) => formatValue(v, m));
  if (new Set(rendered).size <= 1) return rendered[0] ?? "—";
  return `${rendered[0]}→${rendered[rendered.length - 1]}`;
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
