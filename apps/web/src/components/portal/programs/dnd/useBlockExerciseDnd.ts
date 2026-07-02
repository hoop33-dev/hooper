import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  BlockExerciseRow,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import {
  computeBlockMove,
  computeExerciseMove,
  type BlockExercisePositionUpdate,
  type BlockPositionUpdate,
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
  reorderBlocksAction?: (
    updates: BlockPositionUpdate[],
  ) => Promise<ActionResult>;
  /**
   * Enables dropping a library exercise onto a session's "add block" zone
   * to create a new block pre-populated with that exercise, in one motion.
   */
  createBlockAction?: (
    sessionId: string,
    name: string,
  ) => Promise<ActionResult<BlockRow>>;
}

type ParsedId = {
  type: "block" | "block-exercise" | "library" | "new-block" | "session";
  value: string;
};

function parseId(id: string): ParsedId | null {
  const separatorIndex = id.indexOf(":");
  if (separatorIndex === -1) return null;
  const type = id.slice(0, separatorIndex);
  const value = id.slice(separatorIndex + 1);
  if (
    type === "block" ||
    type === "block-exercise" ||
    type === "library" ||
    type === "new-block" ||
    type === "session"
  ) {
    return { type, value };
  }
  return null;
}

/** Id for the "+ Add block" zone that creates a new block from a dragged
 * exercise, scoped to a specific session so each column targets itself. */
export function newBlockDropId(sessionId: string): string {
  return `new-block:${sessionId}`;
}

/** Id for a session column's own drop zone, used to move/append a whole
 * block into a session that has no blocks to hover over yet. */
export function sessionDropId(sessionId: string): string {
  return `session:${sessionId}`;
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

/** Resolves which session a block drop targets, from either a block-level
 * over-target (use that block's own session) or a session column zone. */
function resolveTargetSession(
  blocks: BlockWithExercises[],
  overId: string,
): { sessionId: string; overBlockId: string | null } | null {
  const over = parseId(overId);
  if (!over) return null;
  if (over.type === "block") {
    const overBlock = blocks.find((b) => b.id === over.value);
    return overBlock
      ? { sessionId: overBlock.session_id, overBlockId: over.value }
      : null;
  }
  if (over.type === "session") {
    return { sessionId: over.value, overBlockId: null };
  }
  return null;
}

async function handleBlockDrop(
  options: UseBlockExerciseDndOptions,
  activeBlockId: string,
  overId: string,
) {
  if (!options.reorderBlocksAction) return;
  const target = resolveTargetSession(options.blocks, overId);
  if (!target) return;
  const result = computeBlockMove(
    options.blocks,
    activeBlockId,
    target.sessionId,
    target.overBlockId,
  );
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

async function handleLibraryDropOnNewBlock(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  exercise: ExerciseWithDetails,
  sessionId: string,
) {
  if (!options.createBlockAction) return;
  const blockResult = await options.createBlockAction(sessionId, "New block");
  if (!blockResult.ok || !blockResult.data) return;

  const exerciseResult = await options.addExerciseToBlockAction({
    block_id: blockResult.data.id,
    exercise_id: exerciseId,
  });
  const exercises =
    exerciseResult.ok && exerciseResult.data
      ? [{ ...exerciseResult.data, exercise }]
      : [];
  options.setBlocks([...options.blocks, { ...blockResult.data, exercises }]);
}

async function handleLibraryDrop(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  overId: string,
) {
  const exercise = options.exercisesById.get(exerciseId);
  if (!exercise) return;

  const overParsed = parseId(overId);
  if (overParsed?.type === "new-block") {
    await handleLibraryDropOnNewBlock(
      options,
      exerciseId,
      exercise,
      overParsed.value,
    );
    return;
  }

  const target = resolveDropTarget(options.blocks, overId);
  if (!target) return;

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
