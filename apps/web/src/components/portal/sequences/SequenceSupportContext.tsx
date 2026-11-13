"use client";

import type { SequenceInput } from "@/src/services/sequence.service";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  LibrarySequenceWithDetails,
  UnitTypeRow,
} from "@hooper/db";
import { createContext, useContext, type ReactNode } from "react";
import type { SequenceExerciseLibrary } from "./SequenceStepPicker";

type ActionResult = { ok: boolean; error?: string; id?: string };

/** What the program and session editors need to show and edit sequences.
 * Absent (null) on a page that doesn't support them. */
export type SequenceSupport = {
  sequences: LibrarySequenceWithDetails[];
  library: SequenceExerciseLibrary;
  unitTypes: UnitTypeRow[];
  /** Powers "Save as new sequence" from a placement. */
  createSequenceAction?: (input: SequenceInput) => Promise<ActionResult>;
};

/** The provider value for an editor page: null (sequences hidden) when
 * the page has no sequence list. */
export function sequenceSupportFor(
  sequences: LibrarySequenceWithDetails[] | undefined,
  exercises: ExerciseWithDetails[],
  categories: ExerciseCategoryRow[],
  unitTypes: UnitTypeRow[],
  createSequenceAction: SequenceSupport["createSequenceAction"],
): SequenceSupport | null {
  return sequences
    ? {
        sequences,
        library: { exercises, categories },
        unitTypes,
        createSequenceAction,
      }
    : null;
}

const SequenceSupportContext = createContext<SequenceSupport | null>(null);

export function SequenceSupportProvider({
  value,
  children,
}: {
  value: SequenceSupport | null;
  children: ReactNode;
}) {
  return (
    <SequenceSupportContext.Provider value={value}>
      {children}
    </SequenceSupportContext.Provider>
  );
}

export function useSequenceSupport(): SequenceSupport | null {
  return useContext(SequenceSupportContext);
}
