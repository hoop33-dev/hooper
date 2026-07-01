export const UNIT_TYPES = [
  "Reps",
  "Reps × Weight (kg)",
  "Reps × Weight (lbs)",
  "Time",
  "Distance",
  "% 1RM",
  "Bodyweight",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];
