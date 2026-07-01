export type MeasurementFields = {
  sets: number;
  unit_type: string;
  reps: number | null;
  value: number | null;
};

export type MeasurementInputMode =
  | "reps-only"
  | "reps-weight"
  | "reps-percent"
  | "duration";

const WEIGHT_UNIT_SUFFIX: Record<string, string> = {
  "Reps × Weight (kg)": "kg",
  "Reps × Weight (lbs)": "lbs",
};

/** Which input fields the measurement modal should show for a given unit type. */
export function measurementInputMode(unitType: string): MeasurementInputMode {
  if (unitType === "Time" || unitType === "Distance") return "duration";
  if (unitType in WEIGHT_UNIT_SUFFIX) return "reps-weight";
  if (unitType === "% 1RM") return "reps-percent";
  return "reps-only"; // "Reps" and "Bodyweight"
}

export function weightUnitLabel(unitType: string): string {
  return WEIGHT_UNIT_SUFFIX[unitType] ?? "";
}

/**
 * Human-readable summary of a placed exercise's measurements, e.g.
 * "4 sets × 8 @ 60 kg", "3 sets × 20s", "3 sets × 8 @ 75%".
 */
export function formatMeasurementSummary(m: MeasurementFields): string {
  const setsLabel = `${m.sets} set${m.sets === 1 ? "" : "s"}`;
  const mode = measurementInputMode(m.unit_type);

  if (mode === "duration") {
    const unit = m.unit_type === "Time" ? "s" : "m";
    return m.value != null ? `${setsLabel} × ${m.value}${unit}` : setsLabel;
  }

  const repsLabel = m.reps != null ? `${m.reps}` : null;
  const base = repsLabel ? `${setsLabel} × ${repsLabel}` : setsLabel;

  if (mode === "reps-weight" && m.value != null) {
    return `${base} @ ${m.value} ${weightUnitLabel(m.unit_type)}`;
  }
  if (mode === "reps-percent" && m.value != null) {
    return `${base} @ ${m.value}%`;
  }
  return base;
}
