"use client";

import type { BlockExerciseWithMeasurements } from "@/src/services/block.service";
import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { useToast } from "../ui/Toast";
import type { BlockExerciseUpdateData } from "./BlockExerciseMeasurementModal";
import {
  patchBlock,
  patchExercise,
  removeBlock,
  removeExercise,
} from "./blocksState";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function reportError(
  showError: (message: string) => void,
  result: { ok: boolean; error?: string },
) {
  if (!result.ok) showError(result.error ?? "Something went wrong.");
}

async function runAddExerciseToBlock(
  blockId: string,
  exerciseId: string,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "addExerciseToBlockAction" | "exercisesById"
  > & { showError: (message: string) => void },
) {
  const exercise = ctx.exercisesById?.get(exerciseId);
  if (!ctx.addExerciseToBlockAction || !exercise) return;
  const result = await ctx.addExerciseToBlockAction({
    block_id: blockId,
    exercise_id: exerciseId,
  });
  if (!result.ok || !result.data) {
    reportError(ctx.showError, result);
    return;
  }
  const newRow = { ...result.data, exercise };
  ctx.setBlocks(
    ctx.blocks.map((b) =>
      b.id === blockId ? { ...b, exercises: [...b.exercises, newRow] } : b,
    ),
  );
}

export interface UseBlockActionsOptions {
  blocks: BlockWithExercises[];
  setBlocks: (blocks: BlockWithExercises[]) => void;
  createBlockAction: (
    sessionId: string,
    name: string,
  ) => Promise<ActionResult<BlockRow>>;
  updateBlockAction: (
    id: string,
    data: { name?: string },
  ) => Promise<ActionResult<BlockRow>>;
  deleteBlockAction: (id: string) => Promise<ActionResult>;
  updateBlockExerciseAction: (
    id: string,
    data: BlockExerciseUpdateData,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
  /** Only needed to power the block header's "+ Add" exercise picker. */
  addExerciseToBlockAction?: (input: {
    block_id: string;
    exercise_id: string;
  }) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  exercisesById?: Map<string, ExerciseWithDetails>;
}

export function useBlockActions(options: UseBlockActionsOptions) {
  const {
    blocks,
    setBlocks,
    createBlockAction,
    updateBlockAction,
    deleteBlockAction,
    updateBlockExerciseAction,
    removeExerciseFromBlockAction,
    addExerciseToBlockAction,
    exercisesById,
  } = options;
  const [editingExercise, setEditingExercise] =
    useState<BlockExerciseWithDetails | null>(null);
  const { showError } = useToast();

  async function addBlock(sessionId: string, name: string) {
    const result = await createBlockAction(sessionId, name);
    if (result.ok && result.data) {
      setBlocks([...blocks, { ...result.data, exercises: [] }]);
    } else {
      reportError(showError, result);
    }
  }

  async function renameBlock(blockId: string, name: string) {
    const result = await updateBlockAction(blockId, { name });
    // color is server-derived from the new name, so patch from the
    // returned row rather than assuming only `name` changed.
    if (result.ok && result.data) {
      setBlocks(patchBlock(blocks, blockId, result.data));
    } else {
      reportError(showError, result);
    }
  }

  async function deleteBlockById(blockId: string) {
    const result = await deleteBlockAction(blockId);
    if (result.ok) setBlocks(removeBlock(blocks, blockId));
    else reportError(showError, result);
  }

  async function saveExerciseMeasurement(data: BlockExerciseUpdateData) {
    if (!editingExercise) return;
    const result = await updateBlockExerciseAction(editingExercise.id, data);
    if (result.ok && result.data) {
      setBlocks(patchExercise(blocks, editingExercise.id, result.data));
      setEditingExercise(null);
    } else {
      reportError(showError, result);
    }
  }

  async function removeExerciseById(exerciseRowId: string) {
    const result = await removeExerciseFromBlockAction(exerciseRowId);
    if (result.ok) setBlocks(removeExercise(blocks, exerciseRowId));
    else reportError(showError, result);
  }

  async function addExerciseToBlock(blockId: string, exerciseId: string) {
    await runAddExerciseToBlock(blockId, exerciseId, {
      blocks,
      setBlocks,
      addExerciseToBlockAction,
      exercisesById,
      showError,
    });
  }

  return {
    editingExercise,
    openExerciseEditor: setEditingExercise,
    closeExerciseEditor: () => setEditingExercise(null),
    addBlock,
    renameBlock,
    deleteBlockById,
    saveExerciseMeasurement,
    removeExerciseById,
    addExerciseToBlock,
  };
}
