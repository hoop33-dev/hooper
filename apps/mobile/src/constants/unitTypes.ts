/** Mirrors apps/web/src/constants/unitTypes.ts's UNIT_TYPE_PRIORITY/sortUnitTypes
 * — that file isn't importable from mobile, so the canonical display order is
 * duplicated here. Reps-like fields first, then weight/load, then effort
 * ratings, so "Reps, Weight, RPE" always reads left to right the same way on
 * both apps, regardless of the order a coach happened to toggle them on in. */
const UNIT_TYPE_PRIORITY = [
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
] as const;

// indexOf returns -1 for a unit type outside the fixed list (custom/legacy
// strings) — falling back to the list's length keeps unknowns after every
// known type instead of jumping to the front. Array.prototype.sort is stable,
// so unknowns keep their relative order among themselves.
function unitTypePriority(unitType: string): number {
  const index = UNIT_TYPE_PRIORITY.findIndex(
    (t) => t.toLowerCase() === unitType.toLowerCase(),
  );
  return index === -1 ? UNIT_TYPE_PRIORITY.length : index;
}

export function sortByUnitTypePriority<T extends { unit_type: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => unitTypePriority(a.unit_type) - unitTypePriority(b.unit_type),
  );
}
