"use client";

import {
  addSequenceSet,
  addSequenceStep,
  clearStepPick,
  duplicateSequenceSet,
  moveSequenceStep,
  pickStepExercise,
  removeSequenceSet,
  removeSequenceStep,
  resizeSequenceSets,
  updateSequenceStep,
} from "@hooper/shared";
import { useState } from "react";
import {
  cloneSet,
  newStepId,
  setDraftValue,
  toggleDraftUnit,
  type EditorSequence,
} from "./sequenceDraft";

export type SequenceEditorActions = ReturnType<
  typeof useSequenceEditor
>["actions"];

/** Local editing state for one sequence. `lockedSets` pins the set count
 * (a sequence in a superset runs once per round). */
export function useSequenceEditor(
  initial: EditorSequence | (() => EditorSequence),
  lockedSets?: number,
) {
  const [draft, setDraft] = useState<EditorSequence>(() => {
    const start = typeof initial === "function" ? initial() : initial;
    return lockedSets ? resizeSequenceSets(start, lockedSets, cloneSet) : start;
  });
  const update = (fn: (d: EditorSequence) => EditorSequence) => setDraft(fn);

  const actions = {
    setName: (name: string) => update((d) => ({ ...d, name })),
    setDescription: (description: string) =>
      update((d) => ({ ...d, description: description || null })),
    toggleUnit: (unitType: string) =>
      update((d) => toggleDraftUnit(d, unitType)),
    setValue: (setIndex: number, position: number, value: number | null) =>
      update((d) => setDraftValue(d, setIndex, position, value)),
    pick: (setIndex: number, stepId: string, exerciseId: string) =>
      update((d) => pickStepExercise(d, setIndex, stepId, exerciseId)),
    clear: (setIndex: number, stepId: string) =>
      update((d) => clearStepPick(d, setIndex, stepId)),
    addSet: () => update((d) => addSequenceSet(d, cloneSet)),
    duplicateSet: (setIndex: number) =>
      update((d) => duplicateSequenceSet(d, setIndex, cloneSet)),
    removeSet: (setIndex: number) =>
      update((d) => removeSequenceSet(d, setIndex)),
    addStep: () => update((d) => addSequenceStep(d, newStepId())),
    updateStep: (
      stepId: string,
      patch: { label?: string; category_id?: string | null },
    ) => update((d) => updateSequenceStep(d, stepId, patch)),
    moveStep: (stepId: string, direction: -1 | 1) =>
      update((d) => moveSequenceStep(d, stepId, direction)),
    removeStep: (stepId: string) =>
      update((d) => removeSequenceStep(d, stepId)),
  };

  return { draft, actions, lockSets: lockedSets !== undefined };
}
