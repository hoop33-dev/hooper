"use client";

import type {
  AddExerciseToBlockInput,
  CreateBlockInput,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type {
  BlockExerciseRow,
  BlockRow,
  ExerciseWithDetails,
  SessionWithBlocks,
} from "@hooper/db";
import { useState } from "react";
import type {
  BlockExercisePositionUpdate,
  PositionUpdate,
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
  reorderBlocksAction: (updates: PositionUpdate[]) => Promise<ActionResult>;
  addExerciseToBlockAction: (
    input: AddExerciseToBlockInput,
  ) => Promise<ActionResult<BlockExerciseRow>>;
  updateBlockExerciseAction: (
    id: string,
    input: UpdateBlockExerciseInput,
  ) => Promise<ActionResult<BlockExerciseRow>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
  reorderBlockExercisesAction: (
    updates: BlockExercisePositionUpdate[],
  ) => Promise<ActionResult>;
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
  });

  const blockActions = useBlockActions({
    blocks,
    setBlocks,
    createBlockAction: (name) =>
      actions.createBlockAction({ session_id: session.id, name }),
    updateBlockAction: actions.updateBlockAction,
    deleteBlockAction: actions.deleteBlockAction,
    updateBlockExerciseAction: actions.updateBlockExerciseAction,
    removeExerciseFromBlockAction: actions.removeExerciseFromBlockAction,
  });

  return { blocks, exercisesById, dnd, blockActions };
}
