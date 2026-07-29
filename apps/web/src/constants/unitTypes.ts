export const UNIT_TYPES = [
  "Reps",
  "Reps Each Side",
  "Weight",
  "Time",
  "Distance",
  "% 1RM",
  "RPE",
  "RIR",
  "Shots",
  "Makes",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

// Display order for the set-editor's measurement columns — reps-like fields
// first, then weight/load, then effort ratings, so "Reps, Weight, RPE" always
// reads left to right in that order regardless of the order a coach happened
// to toggle them on in.
const UNIT_TYPE_PRIORITY: readonly UnitType[] = [
  "Reps",
  "Reps Each Side",
  "Weight",
  "% 1RM",
  "RPE",
  "RIR",
  "Time",
  "Distance",
  "Shots",
  "Makes",
];

export function sortUnitTypes(types: string[]): string[] {
  return [...types].sort(
    (a, b) =>
      UNIT_TYPE_PRIORITY.indexOf(a as UnitType) -
      UNIT_TYPE_PRIORITY.indexOf(b as UnitType),
  );
}
