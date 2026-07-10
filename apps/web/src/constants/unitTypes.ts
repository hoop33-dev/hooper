export const UNIT_TYPES = [
  "Reps",
  "Reps Each Side",
  "Weight",
  "Time",
  "Distance",
  "% 1RM",
  "RPE",
  "Shots",
  "Makes",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];
