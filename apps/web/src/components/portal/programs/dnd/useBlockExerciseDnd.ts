import type { BlockExerciseWithMeasurements } from "@/src/services/block.service";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { useToast } from "../../ui/Toast";
import {
  computeBlockMove,
  computeExerciseMove,
  type BlockExercisePositionUpdate,
  type BlockPositionUpdate,
} from "./dropComputation";
import { isInsertAfter, isInsertAfterForBlockTarget } from "./insertPosition";
import {
  createPendingBlock,
  createPendingBlockFromTemplate,
  createPendingExercise,
} from "./pendingRows";

function reportIfFailed(
  onError: (message: string) => void,
  result: { ok: boolean; error?: string },
) {
  if (!result.ok) onError(result.error ?? "Something went wrong.");
}

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface UseBlockExerciseDndOptions {
  blocks: BlockWithExercises[];
  setBlocks: (blocks: BlockWithExercises[]) => void;
  exercisesById: Map<string, ExerciseWithDetails>;
  addExerciseToBlockAction: (input: {
    block_id: string;
    exercise_id: string;
  }) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
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
  /** Enables dropping a Block Library template onto any block/session drop
   * zone, copying its exercises/measurements into a brand-new block. */
  createBlockFromTemplateAction?: (input: {
    session_id: string;
    block_template_id: string;
  }) => Promise<ActionResult<BlockWithExercises>>;
  /** Block name for each single-block template shown in the Block Library
   * panel, keyed by its block_template id — used for the pending placeholder
   * shown while createBlockFromTemplateAction resolves. */
  blockTemplateNamesById?: Map<string, string>;
}

type ParsedId = {
  type:
    | "block"
    | "block-exercise"
    | "library"
    | "block-template"
    | "new-block"
    | "session";
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
    type === "block-template" ||
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
  over: Over,
  pointerY: number | null,
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
      insertAfter: isInsertAfter(pointerY, over),
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
 * over-target (use that block's own session), a session column zone, or the
 * "+ Add block" zone (equivalent to its session — there's no block to
 * anchor a position to yet). */
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
  if (over.type === "session" || over.type === "new-block") {
    return { sessionId: over.value, overBlockId: null };
  }
  return null;
}

async function handleBlockDrop(
  options: UseBlockExerciseDndOptions,
  activeBlockId: string,
  pointerY: number | null,
  over: Over,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.reorderBlocksAction) return;
  const target = resolveTargetSession(options.blocks, String(over.id));
  if (!target) return;
  const result = computeBlockMove(
    options.blocks,
    activeBlockId,
    target.sessionId,
    target.overBlockId,
    target.overBlockId ? isInsertAfterForBlockTarget(pointerY, over) : false,
  );
  if (!result) return;
  markCommitted();
  options.setBlocks(result.blocks);
  reportIfFailed(onError, await options.reorderBlocksAction(result.updates));
}

async function handleExerciseDrop(
  options: UseBlockExerciseDndOptions,
  activeExerciseId: string,
  pointerY: number | null,
  over: Over,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  const sourceBlockId = findBlockIdForExercise(
    options.blocks,
    activeExerciseId,
  );
  const target = resolveExerciseTarget(
    options.blocks,
    over,
    pointerY,
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
  reportIfFailed(
    onError,
    await options.reorderBlockExercisesAction(result.updates),
  );
}

/** Appends a freshly-created row to a block's exercise list, unordered —
 * callers reposition it afterward if it wasn't dropped at the end. */
function appendExerciseToBlock(
  blocks: BlockWithExercises[],
  blockId: string,
  row: BlockExerciseWithDetails,
): BlockWithExercises[] {
  return blocks.map((b) =>
    b.id === blockId ? { ...b, exercises: [...b.exercises, row] } : b,
  );
}

/** Appends `row` to its block, then — if it was dropped over a specific row
 * rather than at the end — repositions it there via computeExerciseMove. */
function placeExercise(
  blocks: BlockWithExercises[],
  target: ExerciseTarget,
  row: BlockExerciseWithDetails,
): BlockWithExercises[] {
  const appended = appendExerciseToBlock(blocks, target.blockId, row);
  if (!target.overExerciseId) return appended;
  const moved = computeExerciseMove(
    appended,
    row.id,
    target.blockId,
    target.blockId,
    target.overExerciseId,
    target.insertAfter,
  );
  return moved ? moved.blocks : appended;
}

async function handleLibraryDropOnNewBlock(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  exercise: ExerciseWithDetails,
  sessionId: string,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.createBlockAction) return;
  markCommitted();

  // Show the new block (and its pending row) immediately instead of waiting
  // on two round trips (create block, then add the exercise to it) — it's
  // dimmed and non-interactive until the real data swaps in.
  const originalBlocks = options.blocks;
  options.setBlocks([
    ...originalBlocks,
    createPendingBlock(sessionId, exercise),
  ]);

  const blockResult = await options.createBlockAction(sessionId, "New block");
  if (!blockResult.ok || !blockResult.data) {
    options.setBlocks(originalBlocks);
    reportIfFailed(onError, blockResult);
    return;
  }

  const exerciseResult = await options.addExerciseToBlockAction({
    block_id: blockResult.data.id,
    exercise_id: exerciseId,
  });
  reportIfFailed(onError, exerciseResult);
  const exercises =
    exerciseResult.ok && exerciseResult.data
      ? [{ ...exerciseResult.data, exercise }]
      : [];
  options.setBlocks([...originalBlocks, { ...blockResult.data, exercises }]);
}

async function handleLibraryDrop(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  pointerY: number | null,
  over: Over,
  markCommitted: () => void,
  onError: (message: string) => void,
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
      onError,
    );
    return;
  }

  const target = resolveExerciseTarget(options.blocks, over, pointerY);
  if (!target) return;

  markCommitted();
  const originalBlocks = options.blocks;

  // Show the row immediately (dimmed/pending) rather than waiting on the
  // network round trip — placeExercise puts it exactly where it'll end up,
  // so nothing visibly reshuffles once the real row swaps in below.
  const pendingRow = createPendingExercise(target.blockId, exercise);
  options.setBlocks(placeExercise(originalBlocks, target, pendingRow));

  const result = await options.addExerciseToBlockAction({
    block_id: target.blockId,
    exercise_id: exerciseId,
  });
  if (!result.ok || !result.data) {
    options.setBlocks(originalBlocks);
    reportIfFailed(onError, result);
    return;
  }

  const newRow = { ...result.data, exercise };
  const appended = appendExerciseToBlock(
    originalBlocks,
    target.blockId,
    newRow,
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
  reportIfFailed(
    onError,
    await options.reorderBlockExercisesAction(reordered.updates),
  );
}

/** Appends `block` to its (already-correct) session, then — if it was
 * dropped over a specific sibling rather than at the end — repositions it
 * there via computeBlockMove. Mirrors placeExercise's append-then-move
 * shape so both the pending placeholder and the eventual real block land in
 * the same spot without a visible jump. */
function placeBlock(
  blocks: BlockWithExercises[],
  sessionId: string,
  overBlockId: string | null,
  insertAfter: boolean,
  block: BlockWithExercises,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } {
  const appended = [...blocks, block];
  if (!overBlockId) return { blocks: appended, updates: [] };
  const moved = computeBlockMove(
    appended,
    block.id,
    sessionId,
    overBlockId,
    insertAfter,
  );
  return moved ?? { blocks: appended, updates: [] };
}

/** Copies a Block Library template into a new block wherever it's dropped —
 * any block/session/"+ Add block" zone all resolve to a target session via
 * resolveTargetSession, since a template always creates a whole new block
 * rather than placing a single exercise. */
async function handleBlockTemplateDrop(
  options: UseBlockExerciseDndOptions,
  blockTemplateId: string,
  pointerY: number | null,
  over: Over,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.createBlockFromTemplateAction) return;
  const target = resolveTargetSession(options.blocks, String(over.id));
  if (!target) return;

  markCommitted();
  const originalBlocks = options.blocks;
  const insertAfter = target.overBlockId
    ? isInsertAfterForBlockTarget(pointerY, over)
    : false;

  // Show the new block immediately at the exact spot it'll end up — not
  // appended at the end — so nothing visibly jumps once the real data
  // swaps in below.
  const name =
    options.blockTemplateNamesById?.get(blockTemplateId) ?? "New block";
  const pendingBlock = createPendingBlockFromTemplate(target.sessionId, name);
  options.setBlocks(
    placeBlock(
      originalBlocks,
      target.sessionId,
      target.overBlockId,
      insertAfter,
      pendingBlock,
    ).blocks,
  );

  const result = await options.createBlockFromTemplateAction({
    session_id: target.sessionId,
    block_template_id: blockTemplateId,
  });
  if (!result.ok || !result.data) {
    options.setBlocks(originalBlocks);
    reportIfFailed(onError, result);
    return;
  }

  const placed = placeBlock(
    originalBlocks,
    target.sessionId,
    target.overBlockId,
    insertAfter,
    result.data,
  );
  options.setBlocks(placed.blocks);
  if (placed.updates.length > 0 && options.reorderBlocksAction) {
    reportIfFailed(onError, await options.reorderBlocksAction(placed.updates));
  }
}

function getPointerY(event: {
  activatorEvent: Event | null;
  delta: { y: number };
}): number | null {
  const activatorEvent = event.activatorEvent;
  if (!activatorEvent) return null;
  if (
    "clientY" in activatorEvent &&
    typeof activatorEvent.clientY === "number"
  ) {
    return activatorEvent.clientY + event.delta.y;
  }
  const touchEvent = activatorEvent as TouchEvent;
  if (touchEvent.touches.length > 0) {
    return touchEvent.touches[0].clientY + event.delta.y;
  }
  if (touchEvent.changedTouches.length > 0) {
    return touchEvent.changedTouches[0].clientY + event.delta.y;
  }
  return null;
}

function createDragStartHandler(
  setActiveId: (value: string | null) => void,
  setPointerY: (value: number | null) => void,
  setSuppressDropAnimation: (value: boolean) => void,
) {
  return (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setPointerY(
      getPointerY({ activatorEvent: event.activatorEvent, delta: { y: 0 } }),
    );
    setSuppressDropAnimation(false);
  };
}

function createDragMoveHandler(
  setPointerY: (value: number | null) => void,
  setDropTarget: (value: { overId: string; after: boolean } | null) => void,
) {
  return (event: DragMoveEvent) => {
    const { over } = event;
    const nextPointerY = getPointerY(event);
    setPointerY(nextPointerY);
    if (!over) {
      setDropTarget(null);
      return;
    }
    setDropTarget({
      overId: String(over.id),
      after: String(over.id).startsWith("block:")
        ? isInsertAfterForBlockTarget(nextPointerY, over)
        : isInsertAfter(nextPointerY, over),
    });
  };
}

function createDragEndHandler(
  options: UseBlockExerciseDndOptions,
  pointerY: number | null,
  setActiveId: (value: string | null) => void,
  setPointerY: (value: number | null) => void,
  setDropTarget: (value: { overId: string; after: boolean } | null) => void,
  setSuppressDropAnimation: (value: boolean) => void,
  onError: (message: string) => void,
) {
  return async (event: DragEndEvent) => {
    setActiveId(null);
    setPointerY(null);
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
        pointerY,
        over,
        markCommitted,
        onError,
      );
    } else if (activeParsed.type === "block-exercise") {
      await handleExerciseDrop(
        options,
        activeParsed.value,
        pointerY,
        over,
        markCommitted,
        onError,
      );
    } else if (activeParsed.type === "block-template") {
      await handleBlockTemplateDrop(
        options,
        activeParsed.value,
        pointerY,
        over,
        markCommitted,
        onError,
      );
    } else {
      await handleLibraryDrop(
        options,
        activeParsed.value,
        pointerY,
        over,
        markCommitted,
        onError,
      );
    }
  };
}

function createDragCancelHandler(
  setActiveId: (value: string | null) => void,
  setPointerY: (value: number | null) => void,
  setDropTarget: (value: { overId: string; after: boolean } | null) => void,
) {
  return () => {
    setActiveId(null);
    setPointerY(null);
    setDropTarget(null);
  };
}

export function useBlockExerciseDnd(options: UseBlockExerciseDndOptions) {
  const { showError } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pointerY, setPointerY] = useState<number | null>(null);
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

  const handleDragStart = createDragStartHandler(
    setActiveId,
    setPointerY,
    setSuppressDropAnimation,
  );
  const handleDragMove = createDragMoveHandler(setPointerY, setDropTarget);
  const handleDragEnd = createDragEndHandler(
    options,
    pointerY,
    setActiveId,
    setPointerY,
    setDropTarget,
    setSuppressDropAnimation,
    showError,
  );
  const handleDragCancel = createDragCancelHandler(
    setActiveId,
    setPointerY,
    setDropTarget,
  );

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
