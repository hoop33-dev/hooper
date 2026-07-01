"use client";

import type {
  BlockExerciseRow,
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
} from "@hooper/db";
import { useState } from "react";
import type { BlockExerciseUpdateData } from "./BlockExerciseMeasurementModal";
import {
  patchBlock,
  patchExercise,
  removeBlock,
  removeExercise,
} from "./blocksState";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface UseBlockActionsOptions {
  blocks: BlockWithExercises[];
  setBlocks: (blocks: BlockWithExercises[]) => void;
  createBlockAction: (name: string) => Promise<ActionResult<BlockRow>>;
  updateBlockAction: (
    id: string,
    data: { name?: string },
  ) => Promise<ActionResult<BlockRow>>;
  deleteBlockAction: (id: string) => Promise<ActionResult>;
  updateBlockExerciseAction: (
    id: string,
    data: BlockExerciseUpdateData,
  ) => Promise<ActionResult<BlockExerciseRow>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
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
  } = options;
  const [editingExercise, setEditingExercise] =
    useState<BlockExerciseWithDetails | null>(null);

  async function addBlock(name: string) {
    const result = await createBlockAction(name);
    if (result.ok && result.data) {
      setBlocks([...blocks, { ...result.data, exercises: [] }]);
    }
  }

  async function renameBlock(blockId: string, name: string) {
    const result = await updateBlockAction(blockId, { name });
    // color is server-derived from the new name, so patch from the
    // returned row rather than assuming only `name` changed.
    if (result.ok && result.data)
      setBlocks(patchBlock(blocks, blockId, result.data));
  }

  async function deleteBlockById(blockId: string) {
    const result = await deleteBlockAction(blockId);
    if (result.ok) setBlocks(removeBlock(blocks, blockId));
  }

  async function saveExerciseMeasurement(data: BlockExerciseUpdateData) {
    if (!editingExercise) return;
    const result = await updateBlockExerciseAction(editingExercise.id, data);
    if (result.ok && result.data) {
      setBlocks(patchExercise(blocks, editingExercise.id, result.data));
      setEditingExercise(null);
    }
  }

  async function removeExerciseById(exerciseRowId: string) {
    const result = await removeExerciseFromBlockAction(exerciseRowId);
    if (result.ok) setBlocks(removeExercise(blocks, exerciseRowId));
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
  };
}
