"use client";

import type {
  BlockExerciseWithMeasurements,
  LinkScope,
  MeasurementInput,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useRouter } from "next/navigation";
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

async function runAddBlock(
  sessionId: string,
  name: string,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "createBlockAction"
  > & {
    showError: (message: string) => void;
  },
) {
  const result = await ctx.createBlockAction(sessionId, name);
  if (result.ok && result.data) {
    ctx.setBlocks([...ctx.blocks, { ...result.data, exercises: [] }]);
  } else {
    reportError(ctx.showError, result);
  }
}

async function runRenameBlock(
  blockId: string,
  name: string,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "updateBlockAction"
  > & {
    showError: (message: string) => void;
  },
) {
  const result = await ctx.updateBlockAction(blockId, { name });
  // color is server-derived from the new name, so patch from the returned
  // row rather than assuming only `name` changed.
  if (result.ok && result.data) {
    ctx.setBlocks(patchBlock(ctx.blocks, blockId, result.data));
  } else {
    reportError(ctx.showError, result);
  }
}

/** Turns a block into (or out of) a superset, or changes its round count.
 * A `sets` change cascades server-side to every exercise in the block (see
 * cascadeSupersetSets in block.service.ts) — that resize can't be reflected
 * in local state without re-fetching each exercise's measurements, so a
 * router refresh follows it instead of an optimistic patch. */
async function runUpdateBlockSettings(
  blockId: string,
  patch: Omit<UpdateBlockInput, "name">,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "updateBlockAction"
  > & {
    showError: (message: string) => void;
    refresh: () => void;
  },
) {
  const result = await ctx.updateBlockAction(blockId, patch);
  if (result.ok && result.data) {
    ctx.setBlocks(patchBlock(ctx.blocks, blockId, result.data));
    if (patch.sets !== undefined) ctx.refresh();
  } else {
    reportError(ctx.showError, result);
  }
}

/** The block a given exercise placement belongs to, or undefined if it
 * isn't in any of the currently-loaded blocks. */
function findParentBlock(
  blocks: BlockWithExercises[],
  blockExerciseId: string,
): BlockWithExercises | undefined {
  return blocks.find((b) => b.exercises.some((e) => e.id === blockExerciseId));
}

async function runSaveExerciseMeasurement(
  data: BlockExerciseUpdateData,
  scope: LinkScope | undefined,
  editingExercise: BlockExerciseWithDetails | null,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "updateBlockExerciseAction"
  > & {
    showError: (message: string) => void;
    onSaved: () => void;
  },
) {
  if (!editingExercise) return;
  const result = await ctx.updateBlockExerciseAction(
    editingExercise.id,
    data,
    scope,
  );
  if (result.ok && result.data) {
    ctx.setBlocks(patchExercise(ctx.blocks, editingExercise.id, result.data));
    ctx.onSaved();
  } else {
    reportError(ctx.showError, result);
  }
}

/** Saves every exercise's measurements in a superset block one placement at
 * a time — there's no batched endpoint, but a superset is a handful of
 * exercises at most, so N sequential saves is simple and fast enough. */
async function runSaveSupersetMeasurements(
  perExercise: { id: string; measurements: MeasurementInput[] }[],
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "updateBlockExerciseAction"
  > & {
    showError: (message: string) => void;
    onSaved: () => void;
  },
) {
  for (const { id, measurements } of perExercise) {
    const result = await ctx.updateBlockExerciseAction(id, { measurements });
    if (!result.ok || !result.data) {
      reportError(ctx.showError, result);
      return;
    }
    ctx.setBlocks(patchExercise(ctx.blocks, id, result.data));
  }
  ctx.onSaved();
}

async function runDeleteBlock(
  blockId: string,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "deleteBlockAction"
  > & {
    showError: (message: string) => void;
  },
) {
  const result = await ctx.deleteBlockAction(blockId);
  if (result.ok) ctx.setBlocks(removeBlock(ctx.blocks, blockId));
  else reportError(ctx.showError, result);
}

async function runRemoveExerciseFromBlock(
  exerciseRowId: string,
  ctx: Pick<
    UseBlockActionsOptions,
    "blocks" | "setBlocks" | "removeExerciseFromBlockAction"
  > & { showError: (message: string) => void },
) {
  const result = await ctx.removeExerciseFromBlockAction(exerciseRowId);
  if (result.ok) ctx.setBlocks(removeExercise(ctx.blocks, exerciseRowId));
  else reportError(ctx.showError, result);
}

async function runSaveBlockAsTemplate(
  name: string,
  block: BlockWithExercises | null,
  saveBlockAsTemplateAction: UseBlockActionsOptions["saveBlockAsTemplateAction"],
  onDone: () => void,
  showError: (message: string) => void,
  showSuccess: (message: string) => void,
) {
  if (!block || !saveBlockAsTemplateAction) return;
  const result = await saveBlockAsTemplateAction(block.id, name);
  if (result.ok) {
    showSuccess(`Saved "${name}" to the Block Library.`);
    onDone();
  } else {
    reportError(showError, result);
  }
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
    data: UpdateBlockInput,
  ) => Promise<ActionResult<BlockRow>>;
  deleteBlockAction: (id: string) => Promise<ActionResult>;
  updateBlockExerciseAction: (
    id: string,
    data: UpdateBlockExerciseInput,
    scope?: LinkScope,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
  /** Only needed to power the block header's "+ Add" exercise picker. */
  addExerciseToBlockAction?: (input: {
    block_id: string;
    exercise_id: string;
  }) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  /** Only needed to power the block header's "Save as template" button. */
  saveBlockAsTemplateAction?: (
    blockId: string,
    name: string,
  ) => Promise<ActionResult>;
  exercisesById?: Map<string, ExerciseWithDetails>;
}

export function useBlockActions(options: UseBlockActionsOptions) {
  const [editingExercise, setEditingExercise] =
    useState<BlockExerciseWithDetails | null>(null);
  const [editingSupersetBlock, setEditingSupersetBlock] =
    useState<BlockWithExercises | null>(null);
  const [savingAsTemplateBlock, setSavingAsTemplateBlock] =
    useState<BlockWithExercises | null>(null);
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const ctx = { ...options, showError, refresh: () => router.refresh() };

  // A superset block edits all of its exercises together (shared rounds), so
  // opening any one of its placements opens the block-level editor instead
  // of the usual single-exercise one.
  function openExerciseEditor(blockExercise: BlockExerciseWithDetails) {
    const parentBlock = findParentBlock(options.blocks, blockExercise.id);
    if (parentBlock?.is_superset) setEditingSupersetBlock(parentBlock);
    else setEditingExercise(blockExercise);
  }

  return {
    editingExercise,
    openExerciseEditor,
    closeExerciseEditor: () => setEditingExercise(null),
    editingSupersetBlock,
    closeSupersetEditor: () => setEditingSupersetBlock(null),
    addBlock: (sessionId: string, name: string) =>
      runAddBlock(sessionId, name, ctx),
    renameBlock: (blockId: string, name: string) =>
      runRenameBlock(blockId, name, ctx),
    updateBlockSettings: (
      blockId: string,
      patch: Omit<UpdateBlockInput, "name">,
    ) => runUpdateBlockSettings(blockId, patch, ctx),
    deleteBlockById: (blockId: string) => runDeleteBlock(blockId, ctx),
    saveExerciseMeasurement: (
      data: BlockExerciseUpdateData,
      scope?: LinkScope,
    ) =>
      runSaveExerciseMeasurement(data, scope, editingExercise, {
        ...ctx,
        onSaved: () => setEditingExercise(null),
      }),
    saveSupersetMeasurements: (
      perExercise: { id: string; measurements: MeasurementInput[] }[],
    ) =>
      runSaveSupersetMeasurements(perExercise, {
        ...ctx,
        onSaved: () => setEditingSupersetBlock(null),
      }),
    removeExerciseById: (exerciseRowId: string) =>
      runRemoveExerciseFromBlock(exerciseRowId, ctx),
    addExerciseToBlock: (blockId: string, exerciseId: string) =>
      runAddExerciseToBlock(blockId, exerciseId, ctx),
    savingAsTemplateBlock,
    openSaveBlockAsTemplate: setSavingAsTemplateBlock,
    closeSaveBlockAsTemplate: () => setSavingAsTemplateBlock(null),
    submitSaveBlockAsTemplate: (name: string) =>
      runSaveBlockAsTemplate(
        name,
        savingAsTemplateBlock,
        options.saveBlockAsTemplateAction,
        () => setSavingAsTemplateBlock(null),
        showError,
        showSuccess,
      ),
  };
}
