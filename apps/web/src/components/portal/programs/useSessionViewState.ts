"use client";

import type {
  AddExerciseToBlockInput,
  BlockExerciseWithMeasurements,
  CreateBlockInput,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type {
  BlockRow,
  ExerciseWithDetails,
  SessionWithBlocks,
} from "@hooper/db";
import { useEffect, useState } from "react";
import type {
  BlockExercisePositionUpdate,
  BlockPositionUpdate,
} from "./dnd/dropComputation";
import { useBlockExerciseDnd } from "./dnd/useBlockExerciseDnd";
import { useBlockActions } from "./useBlockActions";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface SessionViewActions {
  createBlockAction: (
    input: CreateBlockInput,
  ) => Promise<ActionResult<BlockRow>>;
  updateBlockAction: (
    id: string,
    input: UpdateBlockInput,
  ) => Promise<ActionResult<BlockRow>>;
  deleteBlockAction: (id: string) => Promise<ActionResult>;
  reorderBlocksAction: (
    updates: BlockPositionUpdate[],
  ) => Promise<ActionResult>;
  addExerciseToBlockAction: (
    input: AddExerciseToBlockInput,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  updateBlockExerciseAction: (
    id: string,
    input: UpdateBlockExerciseInput,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
  reorderBlockExercisesAction: (
    updates: BlockExercisePositionUpdate[],
  ) => Promise<ActionResult>;
  /** Unlike the program canvas, this page only ever loads its own session,
   * so it can't tell locally which other weeks a linked exercise spans —
   * this is a real lookup so the measurement modal can still show the
   * "this / future / all" scope choice. */
  getLinkedWeeksForExerciseAction: (
    id: string,
  ) => Promise<ActionResult<number[]>>;
}

/** The single-session page has no local visibility into other weeks, so
 * whether the exercise currently being edited is linked (and to which
 * weeks) has to be fetched on demand instead of computed client-side like
 * the program canvas does (see linkedWeeksOfExercise in
 * useProgramCanvasState.ts). */
function useEditingExerciseLinkedWeeks(
  editingExerciseId: string | undefined,
  getLinkedWeeksForExerciseAction: SessionViewActions["getLinkedWeeksForExerciseAction"],
) {
  const [linkedWeeks, setLinkedWeeks] = useState<number[] | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!editingExerciseId) {
      setLinkedWeeks(undefined);
      return;
    }
    const id = editingExerciseId;
    let cancelled = false;
    async function load() {
      const result = await getLinkedWeeksForExerciseAction(id);
      if (cancelled) return;
      setLinkedWeeks(
        result.ok && result.data && result.data.length > 1
          ? result.data
          : undefined,
      );
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [editingExerciseId, getLinkedWeeksForExerciseAction]);

  return linkedWeeks;
}

export function useSessionViewState(
  session: SessionWithBlocks,
  exercises: ExerciseWithDetails[],
  actions: SessionViewActions,
) {
  const [blocks, setBlocks] = useState(session.blocks);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));

  const dnd = useBlockExerciseDnd({
    blocks,
    setBlocks,
    exercisesById,
    addExerciseToBlockAction: actions.addExerciseToBlockAction,
    reorderBlockExercisesAction: actions.reorderBlockExercisesAction,
    reorderBlocksAction: actions.reorderBlocksAction,
    createBlockAction: (sessionId, name) =>
      actions.createBlockAction({ session_id: sessionId, name }),
  });

  const blockActions = useBlockActions({
    blocks,
    setBlocks,
    createBlockAction: (sessionId, name) =>
      actions.createBlockAction({ session_id: sessionId, name }),
    updateBlockAction: actions.updateBlockAction,
    deleteBlockAction: actions.deleteBlockAction,
    updateBlockExerciseAction: actions.updateBlockExerciseAction,
    removeExerciseFromBlockAction: actions.removeExerciseFromBlockAction,
    addExerciseToBlockAction: actions.addExerciseToBlockAction,
    exercisesById,
  });

  const editingExerciseLinkedWeeks = useEditingExerciseLinkedWeeks(
    blockActions.editingExercise?.id,
    actions.getLinkedWeeksForExerciseAction,
  );

  return {
    blocks,
    exercisesById,
    dnd,
    blockActions,
    editingExerciseLinkedWeeks,
  };
}
