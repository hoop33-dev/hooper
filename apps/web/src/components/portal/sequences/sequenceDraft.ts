import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type {
  MeasurementInput,
  MeasurementSetInput,
  MeasurementSlotInput,
} from "@/src/services/block.service";
import type { SequenceInput } from "@/src/services/sequence.service";
import type { SequenceStepInput } from "@/src/services/sequenceSteps";
import type {
  BlockExerciseMeasurementRow,
  ExerciseRow,
  LibrarySequenceWithDetails,
  PlacedSequence,
  SequenceStepWithPicks,
} from "@hooper/db";
import type { SequenceDraft } from "@hooper/shared";

/** What the sequence editor works on: steps with exercise-id picks, one
 * measurement set per sequence set (every set tracks the same units). */
export type EditorSequence = SequenceDraft<MeasurementSetInput> & {
  name: string;
  description: string | null;
};

export const MAX_SEQUENCE_UNITS = 3;

let localId = 0;
/** Ids for steps that only exist in the editor; the server assigns real
 * ones on save. */
export function newStepId(): string {
  localId += 1;
  return `local-step-${Date.now()}-${localId}`;
}

function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 6 : 0;
}

export function defaultSlot(unitType: string): MeasurementSlotInput {
  return {
    unit_type: unitType,
    value: defaultValueFor(unitType),
    value_unit: defaultUnitFor(unitType),
    value_entered_by: "coach",
  };
}

export function cloneSet(set: MeasurementSetInput | undefined) {
  return {
    slots: (set?.slots ?? [defaultSlot("Reps")]).map((s) => ({ ...s })),
  };
}

function measurementsToSets(
  rows: Pick<
    BlockExerciseMeasurementRow,
    | "position"
    | "set_index"
    | "unit_type"
    | "value"
    | "value_entered_by"
    | "value_unit"
  >[],
  setsCount: number,
): MeasurementInput {
  const bySet = new Map<number, MeasurementSlotInput[]>();
  for (const row of [...rows].sort((a, b) => a.position - b.position)) {
    const slots = bySet.get(row.set_index) ?? [];
    slots.push({
      unit_type: row.unit_type,
      value: row.value,
      value_unit: row.value_unit,
      value_entered_by: row.value_entered_by,
    });
    bySet.set(row.set_index, slots);
  }
  const sets: MeasurementInput = [];
  for (let i = 0; i < Math.max(1, setsCount); i++) {
    const slots = bySet.get(i);
    sets.push(slots ? { slots } : cloneSet(sets.at(-1)));
  }
  return sets;
}

function stepsToDraft(steps: SequenceStepWithPicks[]) {
  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    category_id: step.category_id,
    picks: Object.fromEntries(
      Object.entries(step.picks).map(([i, exercise]) => [i, exercise.id]),
    ),
  }));
}

export function draftFromPlacement(
  sequence: PlacedSequence,
  measurements: BlockExerciseMeasurementRow[],
  sets: number,
): EditorSequence {
  return {
    name: sequence.name,
    description: sequence.description,
    steps: stepsToDraft(sequence.steps),
    sets: measurementsToSets(measurements, sets),
  };
}

export function draftFromLibrary(
  sequence: LibrarySequenceWithDetails,
): EditorSequence {
  return {
    name: sequence.name,
    description: sequence.description,
    steps: stepsToDraft(sequence.steps),
    sets: measurementsToSets(sequence.measurements, sequence.sets),
  };
}

export function blankDraft(): EditorSequence {
  return {
    name: "",
    description: null,
    steps: [
      { id: newStepId(), label: "Step 1", category_id: null, picks: {} },
      { id: newStepId(), label: "Step 2", category_id: null, picks: {} },
    ],
    sets: [cloneSet(undefined), cloneSet(undefined), cloneSet(undefined)],
  };
}

/** The units the sequence tracks, from its first set. */
export function draftUnitTypes(draft: EditorSequence): string[] {
  return draft.sets[0]?.slots.map((s) => s.unit_type) ?? [];
}

/** Turns a unit on or off for every set, keeping existing values. Keeps at
 * least one unit and at most MAX_SEQUENCE_UNITS. */
export function toggleDraftUnit(
  draft: EditorSequence,
  unitType: string,
): EditorSequence {
  const current = draftUnitTypes(draft);
  const on = current.includes(unitType);
  if (on && current.length < 2) return draft;
  if (!on && current.length >= MAX_SEQUENCE_UNITS) return draft;
  return {
    ...draft,
    sets: draft.sets.map((set) => ({
      slots: on
        ? set.slots.filter((s) => s.unit_type !== unitType)
        : [...set.slots, defaultSlot(unitType)],
    })),
  };
}

export function setDraftValue(
  draft: EditorSequence,
  setIndex: number,
  position: number,
  value: number | null,
): EditorSequence {
  return {
    ...draft,
    sets: draft.sets.map((set, i) =>
      i === setIndex
        ? {
            slots: set.slots.map((slot, p) =>
              p === position ? { ...slot, value } : slot,
            ),
          }
        : set,
    ),
  };
}

export function draftStepInputs(draft: EditorSequence): SequenceStepInput[] {
  return draft.steps.map((step) => ({
    label: step.label.trim() || "Step",
    category_id: step.category_id,
    picks: step.picks,
  }));
}

/** The placed-sequence shape for optimistic UI, resolving picks against the
 * loaded exercise library. Unknown ids are dropped. */
export function draftToPlaced(
  draft: EditorSequence,
  exercisesById: Map<string, ExerciseRow>,
  sourceSequenceId: string | null,
): PlacedSequence {
  return {
    name: draft.name.trim() || "Untitled sequence",
    description: draft.description?.trim() || null,
    sourceSequenceId,
    steps: draft.steps.map((step, position) => ({
      id: step.id,
      position,
      label: step.label,
      category_id: step.category_id,
      picks: Object.fromEntries(
        Object.entries(step.picks).flatMap(([i, id]) => {
          const exercise = exercisesById.get(id);
          return exercise ? [[i, exercise]] : [];
        }),
      ),
    })),
  };
}

/** The full save payload for a library sequence. */
export function toSequenceInput(draft: EditorSequence): SequenceInput {
  return {
    name: draft.name.trim() || "Untitled sequence",
    description: draft.description?.trim() || null,
    measurements: draft.sets,
    steps: draftStepInputs(draft),
  };
}
