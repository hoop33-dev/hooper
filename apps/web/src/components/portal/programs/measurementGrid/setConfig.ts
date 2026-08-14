import { sortUnitTypes } from "@/src/constants/unitTypes";
import { resolveMostCommonId } from "@/src/lib/blockExerciseDisplay";
import {
  convertUnit,
  defaultUnitFor,
  type Measurement,
} from "@/src/lib/measurementFormat";
import type {
  BlockExerciseWithDetails,
  EnteredBy,
  ExerciseRow,
  ExerciseStyleRow,
} from "@hooper/db";

/** Mirrors block.service.ts's defaultValueFor: Reps-like unit types default
 * to a nonzero starting count; everything else starts at zero. */
function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 8 : 0;
}

/** One unit-type slot's editable value within a single set — up to 3 per
 * set, independently chosen (unlike the old shared-per-placement column). */
export type SetSlotState = {
  unit_type: string;
  value_unit: string | null;
  value: number;
  value_entered_by: EnteredBy;
};

/** One set's full editable config: its chosen unit-type slots, plus which
 * variant and style this specific set uses. `variantId`/`styleId` are
 * always resolved (never sparse) here — "" means "no style" for select
 * convenience, matching an HTML <select>'s string-only values. */
export type SetConfigState = {
  slots: SetSlotState[];
  variantId: string;
  styleId: string;
};

export function buildDefaultSlots(unitTypes: string[]): SetSlotState[] {
  return unitTypes.map((unitType) => ({
    unit_type: unitType,
    value_unit: defaultUnitFor(unitType),
    value: defaultValueFor(unitType),
    value_entered_by: "coach" as const,
  }));
}

/** One set's slots, resolved from a placement's existing flat measurement
 * rows — falls back to `defaultUnitTypes` (the exercise's configured
 * defaults) when this particular set has no rows of its own yet. */
function resolveSetSlots(
  blockExercise: BlockExerciseWithDetails,
  setIndex: number,
  defaultUnitTypes: string[],
): SetSlotState[] {
  const rows = blockExercise.measurements
    .filter((m) => m.set_index === setIndex)
    .sort((a, b) => a.position - b.position);
  if (rows.length === 0) return buildDefaultSlots(defaultUnitTypes);
  return rows.map((row) => ({
    unit_type: row.unit_type,
    value_unit: row.value_unit,
    value: row.value ?? defaultValueFor(row.unit_type),
    value_entered_by: row.value_entered_by,
  }));
}

/** Every set's initial editable config, built from a placement's existing
 * per-set measurement rows, variant overrides, and style overrides. */
export function initSetConfigs(
  blockExercise: BlockExerciseWithDetails,
  defaultUnitTypes: string[],
): SetConfigState[] {
  return Array.from({ length: blockExercise.sets }, (_, setIndex) => ({
    slots: resolveSetSlots(blockExercise, setIndex, defaultUnitTypes),
    variantId:
      blockExercise.setVariants[setIndex]?.id ?? blockExercise.exercise_id,
    styleId:
      setIndex in blockExercise.setStyles
        ? (blockExercise.setStyles[setIndex]?.id ?? "")
        : (blockExercise.style_id ?? ""),
  }));
}

/** Pads (deep-copying the last set's *entire* config — slots, variant, and
 * style together) or truncates a placement's list of sets to a new count —
 * "add a 4th set" copies set 3 in full, not just its numeric values. */
export function resizeSetConfigs(
  configs: SetConfigState[],
  newCount: number,
): SetConfigState[] {
  const last = configs[configs.length - 1];
  return Array.from({ length: newCount }, (_, i) => {
    const existing = configs[i] ?? last;
    if (!existing) return { slots: [], variantId: "", styleId: "" };
    return {
      slots: existing.slots.map((s) => ({ ...s })),
      variantId: existing.variantId,
      styleId: existing.styleId,
    };
  });
}

export function updateSetVariant(
  configs: SetConfigState[],
  setIndex: number,
  variantId: string,
): SetConfigState[] {
  return configs.map((c, i) => (i === setIndex ? { ...c, variantId } : c));
}

export function updateSetStyle(
  configs: SetConfigState[],
  setIndex: number,
  styleId: string,
): SetConfigState[] {
  return configs.map((c, i) => (i === setIndex ? { ...c, styleId } : c));
}

/** Replaces one set's chosen unit types, trying to preserve each surviving
 * unit type's existing value/unit/athlete-entered state rather than
 * resetting everything to defaults — only unit types newly added to the set
 * get a fresh default value. */
export function updateSetUnitTypes(
  configs: SetConfigState[],
  setIndex: number,
  unitTypes: string[],
): SetConfigState[] {
  return configs.map((c, i) => {
    if (i !== setIndex) return c;
    const bySlotUnitType = new Map(c.slots.map((s) => [s.unit_type, s]));
    return {
      ...c,
      slots: sortUnitTypes(unitTypes).map(
        (unitType) =>
          bySlotUnitType.get(unitType) ?? buildDefaultSlots([unitType])[0]!,
      ),
    };
  });
}

export function updateSlotValue(
  configs: SetConfigState[],
  setIndex: number,
  slotIndex: number,
  patch: Partial<Pick<SetSlotState, "value" | "value_entered_by">>,
): SetConfigState[] {
  return configs.map((c, i) =>
    i === setIndex
      ? {
          ...c,
          slots: c.slots.map((s, si) =>
            si === slotIndex ? { ...s, ...patch } : s,
          ),
        }
      : c,
  );
}

/** Copies one set's slot value (and athlete-entered flag) down into every
 * set below it at the same slot index, leaving sets above untouched, and
 * skipping any set that has no slot at that index at all — the Shift+Enter
 * keyboard shortcut. Position-based: it copies into whichever slot sits at
 * that index in a later set, regardless of whether that slot happens to be
 * the same unit type. */
export function copySlotValueToAllBelow(
  configs: SetConfigState[],
  setIndex: number,
  slotIndex: number,
): SetConfigState[] {
  const source = configs[setIndex]?.slots[slotIndex];
  if (!source) return configs;
  return configs.map((c, i) => {
    if (i <= setIndex || !c.slots[slotIndex]) return c;
    return {
      ...c,
      slots: c.slots.map((s, si) =>
        si === slotIndex
          ? {
              ...s,
              value: source.value,
              value_entered_by: source.value_entered_by,
            }
          : s,
      ),
    };
  });
}

export function updateSlotUnit(
  configs: SetConfigState[],
  setIndex: number,
  slotIndex: number,
  newUnit: string,
): SetConfigState[] {
  return configs.map((c, i) => {
    if (i !== setIndex) return c;
    return {
      ...c,
      slots: c.slots.map((s, si) => {
        if (si !== slotIndex) return s;
        const fromUnit = s.value_unit ?? newUnit;
        return {
          ...s,
          value_unit: newUnit,
          value: convertUnit(s.value, fromUnit, newUnit, s.unit_type),
        };
      }),
    };
  });
}

/** Overwrites every set's units/variant/style with one picked value — the
 * "Apply to all sets" panel's destructive broadcast. */
export function applyUnitTypesToAll(
  configs: SetConfigState[],
  unitTypes: string[],
): SetConfigState[] {
  return configs.map((_, i) => updateSetUnitTypes(configs, i, unitTypes)[i]!);
}

export function applyVariantToAll(
  configs: SetConfigState[],
  variantId: string,
): SetConfigState[] {
  return configs.map((c) => ({ ...c, variantId }));
}

export function applyStyleToAll(
  configs: SetConfigState[],
  styleId: string,
): SetConfigState[] {
  return configs.map((c) => ({ ...c, styleId }));
}

/** Copies round/set 1's setup (its unit types, variant, and style) onto
 * every other round — the superset editor's single "Apply to all rounds"
 * button. Unlike applyUnitTypesToAll, each other round keeps its own
 * numeric values for whichever unit types it already shared with round 1
 * (via updateSetUnitTypes's value-preserving merge) rather than having
 * every value overwritten too — a pyramid/wave superset's per-round numbers
 * are usually intentionally different, only the setup should sync. */
export function applyFirstRoundToAll(
  configs: SetConfigState[],
): SetConfigState[] {
  const first = configs[0];
  if (!first) return configs;
  const firstUnitTypes = first.slots.map((s) => s.unit_type);
  return configs.map((c, i) => {
    if (i === 0) return c;
    const { slots } = updateSetUnitTypes(configs, i, firstUnitTypes)[i]!;
    return { slots, variantId: first.variantId, styleId: first.styleId };
  });
}

/** Flattens editable set configs into the flat per-row shape the format
 * helpers (formatMeasurementSummary/formatMeasurementCompact) consume —
 * blanking out fields the athlete hasn't entered yet, for display purposes
 * only. */
export function toFlatMeasurements(configs: SetConfigState[]): Measurement[] {
  return configs.flatMap((c, set_index) =>
    c.slots.map((s) => ({
      unit_type: s.unit_type,
      set_index,
      value: s.value_entered_by === "athlete" ? null : s.value,
      value_entered_by: s.value_entered_by,
      value_unit: s.value_unit,
    })),
  );
}

/** Builds the block.service.ts-shaped save payload (set-major: one entry
 * per set, each holding its own slots) — coerces athlete-entered fields to
 * null so a stale in-memory number never gets persisted for them. */
export function toMeasurementInput(configs: SetConfigState[]) {
  return configs.map((c) => ({
    slots: c.slots.map((s) => ({
      unit_type: s.unit_type,
      value_unit: s.value_unit,
      value: s.value_entered_by === "athlete" ? null : Math.max(0, s.value),
      value_entered_by: s.value_entered_by,
    })),
  }));
}

export function toSetVariantsPayload(
  configs: SetConfigState[],
): Record<number, string> {
  return Object.fromEntries(configs.map((c, i) => [i, c.variantId]));
}

export function toSetStylesPayload(
  configs: SetConfigState[],
): Record<number, string | null> {
  return Object.fromEntries(configs.map((c, i) => [i, c.styleId || null]));
}

/** A placement's new variant/style save payload, resolved from its editable
 * set configs: the winning variant/style (most common across `sets`, see
 * resolveMostCommonId) becomes the placement's own new `exercise_id`/
 * `style_id` default, alongside the sparse per-set override maps needed to
 * reach that state — plus resolved (id -> row) copies of both maps for
 * optimistic local-state patching. Shared by the single-exercise and
 * superset save flows so a per-set variant/style edit is persisted the same
 * way from either modal. */
export function toVariantStylePayload(
  baseExerciseId: string,
  baseStyleId: string | null,
  sets: number,
  configs: SetConfigState[],
  variantOptions: ExerciseRow[],
  styles: ExerciseStyleRow[],
) {
  const set_variants = toSetVariantsPayload(configs);
  const { winnerId: exercise_id } = resolveMostCommonId(
    baseExerciseId,
    set_variants,
    sets,
  );

  const styleOverridesForResolve = Object.fromEntries(
    configs.map((c, i) => [i, c.styleId]),
  );
  const { winnerId: styleWinner } = resolveMostCommonId(
    baseStyleId ?? "",
    styleOverridesForResolve,
    sets,
  );
  const style_id = styleWinner || null;

  return {
    exercise_id,
    style_id,
    set_variants,
    set_styles: toSetStylesPayload(configs),
    resolvedSetVariants: Object.fromEntries(
      configs
        .map(
          (c, i) =>
            [i, variantOptions.find((v) => v.id === c.variantId)] as const,
        )
        .filter(
          (entry): entry is [number, ExerciseRow] => entry[1] !== undefined,
        ),
    ),
    resolvedSetStyles: Object.fromEntries(
      configs.map((c, i) => [
        i,
        styles.find((s) => s.id === c.styleId) ?? null,
      ]),
    ),
  };
}

export type VariantStylePayload = ReturnType<typeof toVariantStylePayload>;

/** The most frequent value in a list, ties broken by whichever occurs
 * first — the simplified ("hide additional info") view's single Variant/
 * Style picker shows this across all of a placement's sets, since every
 * config here always carries a concrete value already (unlike the sparse
 * saved-row overrides resolveMostCommonId in blockExerciseDisplay.ts
 * resolves against a base id). */
export function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  const firstSeenAt = new Map<string, number>();
  values.forEach((value, i) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
    if (!firstSeenAt.has(value)) firstSeenAt.set(value, i);
  });

  let winner = values[0] ?? "";
  let winnerCount = 0;
  for (const [value, count] of counts) {
    const isBetter =
      count > winnerCount ||
      (count === winnerCount &&
        firstSeenAt.get(value)! < (firstSeenAt.get(winner) ?? Infinity));
    if (isBetter) {
      winner = value;
      winnerCount = count;
    }
  }
  return winner;
}
