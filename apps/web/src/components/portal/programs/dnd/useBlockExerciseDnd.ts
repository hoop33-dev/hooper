import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  BlockExerciseRow,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import {
  computeBlockReorder,
  computeExerciseMove,
  type BlockExercisePositionUpdate,
  type PositionUpdate,
} from "./dropComputation";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface UseBlockExerciseDndOptions {
  blocks: BlockWithExercises[];
  setBlocks: (blocks: BlockWithExercises[]) => void;
  exercisesById: Map<string, ExerciseWithDetails>;
  addExerciseToBlockAction: (input: {
    block_id: string;
    exercise_id: string;
  }) => Promise<ActionResult<BlockExerciseRow>>;
  reorderBlockExercisesAction: (
    updates: BlockExercisePositionUpdate[],
  ) => Promise<ActionResult>;
  /** Undefined on the canvas — block reordering is session-view only. */
  reorderBlocksAction?: (updates: PositionUpdate[]) => Promise<ActionResult>;
}

type ParsedId = { type: "block" | "block-exercise" | "library"; value: string };

function parseId(id: string): ParsedId | null {
  const separatorIndex = id.indexOf(":");
  if (separatorIndex === -1) return null;
  const type = id.slice(0, separatorIndex);
  const value = id.slice(separatorIndex + 1);
  if (type === "block" || type === "block-exercise" || type === "library") {
    return { type, value };
  }
  return null;
}

function findBlockIdForExercise(
  blocks: BlockWithExercises[],
  exerciseRowId: string,
): string | null {
  return (
    blocks.find((b) => b.exercises.some((e) => e.id === exerciseRowId))?.id ??
    null
  );
}

function resolveDropTarget(
  blocks: BlockWithExercises[],
  overId: string,
): { blockId: string; overExerciseId: string | null } | null {
  const over = parseId(overId);
  if (!over) return null;
  if (over.type === "block")
    return { blockId: over.value, overExerciseId: null };
  if (over.type === "block-exercise") {
    const blockId = findBlockIdForExercise(blocks, over.value);
    return blockId ? { blockId, overExerciseId: over.value } : null;
  }
  return null;
}

async function handleBlockDrop(
  options: UseBlockExerciseDndOptions,
  activeBlockId: string,
  overId: string,
) {
  if (!options.reorderBlocksAction) return;
  const result = computeBlockReorder(options.blocks, activeBlockId, overId);
  if (!result) return;
  options.setBlocks(result.blocks);
  await options.reorderBlocksAction(result.updates);
}

async function handleExerciseDrop(
  options: UseBlockExerciseDndOptions,
  activeExerciseId: string,
  overId: string,
) {
  const sourceBlockId = findBlockIdForExercise(
    options.blocks,
    activeExerciseId,
  );
  const target = resolveDropTarget(options.blocks, overId);
  if (!sourceBlockId || !target) return;

  const result = computeExerciseMove(
    options.blocks,
    activeExerciseId,
    sourceBlockId,
    target.blockId,
    target.overExerciseId,
  );
  if (!result) return;
  options.setBlocks(result.blocks);
  await options.reorderBlockExercisesAction(result.updates);
}

async function handleLibraryDrop(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  overId: string,
) {
  const target = resolveDropTarget(options.blocks, overId);
  const exercise = options.exercisesById.get(exerciseId);
  if (!target || !exercise) return;

  const result = await options.addExerciseToBlockAction({
    block_id: target.blockId,
    exercise_id: exerciseId,
  });
  if (!result.ok || !result.data) return;

  const newRow = { ...result.data, exercise };
  const appended = options.blocks.map((b) =>
    b.id === target.blockId ? { ...b, exercises: [...b.exercises, newRow] } : b,
  );

  if (!target.overExerciseId) {
    options.setBlocks(appended);
    return;
  }

  // Dropped onto a specific row rather than empty block space — move the
  // newly-appended row to that index instead of leaving it at the end.
  const reordered = computeExerciseMove(
    appended,
    newRow.id,
    target.blockId,
    target.blockId,
    target.overExerciseId,
  );
  if (!reordered) {
    options.setBlocks(appended);
    return;
  }
  options.setBlocks(reordered.blocks);
  await options.reorderBlockExercisesAction(reordered.updates);
}

export function useBlockExerciseDnd(options: UseBlockExerciseDndOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeParsed = parseId(active.id as string);
    if (!activeParsed) return;

    if (activeParsed.type === "block") {
      await handleBlockDrop(options, activeParsed.value, over.id as string);
    } else if (activeParsed.type === "block-exercise") {
      await handleExerciseDrop(options, activeParsed.value, over.id as string);
    } else {
      await handleLibraryDrop(options, activeParsed.value, over.id as string);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
