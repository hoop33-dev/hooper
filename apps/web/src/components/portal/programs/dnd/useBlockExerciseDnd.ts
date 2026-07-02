import {
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Over,
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
import { isInsertAfter } from "./insertPosition";

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

type ExerciseTarget = {
  blockId: string;
  overExerciseId: string | null;
  insertAfter: boolean;
};

/**
 * Where an exercise/library item should land. Over a row: before/after that
 * row per the pointer. Over a block itself (i.e. its header, since rows claim
 * the body): at the front of the block — `excludeId` keeps a self-drag from
 * targeting itself.
 */
function resolveExerciseTarget(
  blocks: BlockWithExercises[],
  active: Active,
  over: Over,
  excludeId?: string,
): ExerciseTarget | null {
  const parsed = parseId(String(over.id));
  if (!parsed) return null;
  if (parsed.type === "block-exercise") {
    const blockId = findBlockIdForExercise(blocks, parsed.value);
    if (!blockId) return null;
    return {
      blockId,
      overExerciseId: parsed.value,
      insertAfter: isInsertAfter(active, over),
    };
  }
  if (parsed.type === "block") {
    const block = blocks.find((b) => b.id === parsed.value);
    if (!block) return null;
    const firstOther = block.exercises.find((e) => e.id !== excludeId);
    return {
      blockId: parsed.value,
      overExerciseId: firstOther?.id ?? null,
      insertAfter: false,
    };
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
  active: Active,
  over: Over,
  markCommitted: () => void,
) {
  if (!options.reorderBlocksAction) return;
  const target = resolveTargetSession(options.blocks, String(over.id));
  if (!target) return;
  const result = computeBlockMove(
    options.blocks,
    activeBlockId,
    target.sessionId,
    target.overBlockId,
    target.overBlockId ? isInsertAfter(active, over) : false,
  );
  if (!result) return;
  markCommitted();
  options.setBlocks(result.blocks);
  await options.reorderBlocksAction(result.updates);
}

async function handleExerciseDrop(
  options: UseBlockExerciseDndOptions,
  activeExerciseId: string,
  active: Active,
  over: Over,
  markCommitted: () => void,
) {
  const sourceBlockId = findBlockIdForExercise(
    options.blocks,
    activeExerciseId,
  );
  const target = resolveExerciseTarget(
    options.blocks,
    active,
    over,
    activeExerciseId,
  );
  if (!sourceBlockId || !target) return;

  const result = computeExerciseMove(
    options.blocks,
    activeExerciseId,
    sourceBlockId,
    target.blockId,
    target.overExerciseId,
    target.insertAfter,
  );
  if (!result) return;
  markCommitted();
  options.setBlocks(result.blocks);
  await options.reorderBlockExercisesAction(result.updates);
}

async function handleLibraryDropOnNewBlock(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  exercise: ExerciseWithDetails,
  sessionId: string,
  markCommitted: () => void,
) {
  if (!options.createBlockAction) return;
  markCommitted();
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
  active: Active,
  over: Over,
  markCommitted: () => void,
) {
  const exercise = options.exercisesById.get(exerciseId);
  if (!exercise) return;

  const overParsed = parseId(String(over.id));
  if (overParsed?.type === "new-block") {
    await handleLibraryDropOnNewBlock(
      options,
      exerciseId,
      exercise,
      overParsed.value,
      markCommitted,
    );
    return;
  }

  const target = resolveExerciseTarget(options.blocks, active, over);
  if (!target) return;

  markCommitted();
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

  // Dropped onto a specific row (or a block header → before its first row) —
  // move the newly-appended row to that position.
  const reordered = computeExerciseMove(
    appended,
    newRow.id,
    target.blockId,
    target.blockId,
    target.overExerciseId,
    target.insertAfter,
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
  const [dropTarget, setDropTarget] = useState<{
    overId: string;
    after: boolean;
  } | null>(null);
  // Suppresses the DragOverlay's snap-back animation once a drop resolves to
  // a real placement, so the item vanishes and appears at its destination
  // instead of flying back — the return animation is reserved for drops
  // somewhere the exercise/block can't actually go.
  const [suppressDropAnimation, setSuppressDropAnimation] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setSuppressDropAnimation(false);
  }

  // Fires continuously as the pointer moves, so the insertion line can track
  // top-half vs bottom-half of the same item (useSortable's `over` alone can't).
  function handleDragMove(event: DragMoveEvent) {
    const { active, over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    setDropTarget({
      overId: String(over.id),
      after: isInsertAfter(active, over),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setDropTarget(null);
    const { active, over } = event;
    if (!over) return;

    const activeParsed = parseId(active.id as string);
    if (!activeParsed) return;

    const markCommitted = () => setSuppressDropAnimation(true);

    if (activeParsed.type === "block") {
      await handleBlockDrop(
        options,
        activeParsed.value,
        active,
        over,
        markCommitted,
      );
    } else if (activeParsed.type === "block-exercise") {
      await handleExerciseDrop(
        options,
        activeParsed.value,
        active,
        over,
        markCommitted,
      );
    } else {
      await handleLibraryDrop(
        options,
        activeParsed.value,
        active,
        over,
        markCommitted,
      );
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setDropTarget(null);
  }

  return {
    sensors,
    activeId,
    indicator: {
      activeId,
      overId: dropTarget?.overId ?? null,
      after: dropTarget?.after ?? false,
    },
    // `null` disables dnd-kit's default snap-back animation for the
    // DragOverlay; `undefined` leaves its default (animate-back) behavior.
    dropAnimation: suppressDropAnimation ? null : undefined,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
