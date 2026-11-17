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

// UNIT_TYPE_PRIORITY.indexOf returns -1 for a unit type that isn't in the
// fixed list (custom/legacy types stored as plain strings in the DB) — since
// -1 sorts before every real index, unknown types used to jump to the front
// instead of the back. Falling back to UNIT_TYPE_PRIORITY.length keeps them
// after every known type; Array.prototype.sort is a stable sort in all
// modern engines, so unknowns keep their relative order among themselves.
function unitTypePriority(type: string): number {
  const index = UNIT_TYPE_PRIORITY.indexOf(type as UnitType);
  return index === -1 ? UNIT_TYPE_PRIORITY.length : index;
}

export function sortUnitTypes(types: string[]): string[] {
  return [...types].sort((a, b) => unitTypePriority(a) - unitTypePriority(b));
}
