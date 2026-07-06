import type { BlockExerciseWithMeasurements } from "@/src/services/block.service";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
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
  SessionTemplateSummary,
} from "@hooper/db";
import { useMemo, useRef, useState } from "react";
import { useToast } from "../../ui/Toast";
import { blockDndCollision } from "./collision";
import {
  computeBlockMove,
  computeExerciseMove,
  type BlockExercisePositionUpdate,
  type BlockPositionUpdate,
} from "./dropComputation";
import { isInsertAfter } from "./insertPosition";
import {
  createPendingBlock,
  createPendingBlockFromTemplate,
  createPendingBlocksFromSessionTemplate,
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
  /** Enables dropping a multi-block Block Library template onto any
   * block/session drop zone, copying every one of its blocks in, in order,
   * as brand-new blocks in one motion. */
  createBlocksFromSessionTemplateAction?: (input: {
    session_id: string;
    session_template_id: string;
  }) => Promise<ActionResult<BlockWithExercises[]>>;
  /** Block name for each single-block template shown in the Block Library
   * panel, keyed by its block_template id — used for the pending placeholder
   * shown while createBlockFromTemplateAction resolves. */
  blockTemplateNamesById?: Map<string, string>;
  /** Every Block Library template summary keyed by its session_template id —
   * used to preview a multi-block template's blocks (names, for the pending
   * placeholders) while createBlocksFromSessionTemplateAction resolves. */
  sessionTemplatesById?: Map<string, SessionTemplateSummary>;
}

type ParsedId = {
  type:
    | "block"
    | "block-exercise"
    | "library"
    | "block-template"
    | "session-template"
    | "new-block"
    | "session"
    | "gap";
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
    type === "session-template" ||
    type === "new-block" ||
    type === "session" ||
    type === "gap"
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

/** Id for the exact insertion point at `index` among a session's blocks —
 * index 0 is before the first block, index `blocks.length` is after the
 * last. One more of these exists than there are blocks in the session. */
export function blockGapDropId(sessionId: string, index: number): string {
  return `gap:${sessionId}:${index}`;
}

function parseGapId(id: string): { sessionId: string; index: number } | null {
  const match = /^gap:(.+):(\d+)$/.exec(id);
  if (!match) return null;
  return { sessionId: match[1], index: Number(match[2]) };
}

/** Resolves a gap's position into the same overBlockId/insertAfter shape the
 * rest of the module works in — the block currently at `index` (insert
 * before it), or the last block with insertAfter (or no block at all, for an
 * empty session) when `index` is past the end. */
function resolveGapBlockPosition(
  blocks: BlockWithExercises[],
  sessionId: string,
  index: number,
): { overBlockId: string | null; insertAfter: boolean } {
  const sessionBlocks = blocks
    .filter((b) => b.session_id === sessionId)
    .sort((a, b) => a.position - b.position);
  const target = sessionBlocks[index];
  if (target) return { overBlockId: target.id, insertAfter: false };
  const last = sessionBlocks[sessionBlocks.length - 1];
  return { overBlockId: last?.id ?? null, insertAfter: !!last };
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

/** Resolves which session a block drop targets and exactly where in it,
 * from a block-level over-target (that block's own session, above/below it
 * per the pointer), a session column zone or "+ Add block" zone (append —
 * there's no block to anchor a position to), or a between-blocks gap (the
 * exact position it marks). */
function resolveTargetSession(
  blocks: BlockWithExercises[],
  over: Over,
  pointerY: number | null,
): {
  sessionId: string;
  overBlockId: string | null;
  insertAfter: boolean;
} | null {
  const parsed = parseId(String(over.id));
  if (!parsed) return null;
  if (parsed.type === "block") {
    const overBlock = blocks.find((b) => b.id === parsed.value);
    return overBlock
      ? {
          sessionId: overBlock.session_id,
          overBlockId: parsed.value,
          insertAfter: isInsertAfter(pointerY, over),
        }
      : null;
  }
  if (parsed.type === "session" || parsed.type === "new-block") {
    return { sessionId: parsed.value, overBlockId: null, insertAfter: false };
  }
  if (parsed.type === "gap") {
    const gap = parseGapId(String(over.id));
    if (!gap) return null;
    return {
      sessionId: gap.sessionId,
      ...resolveGapBlockPosition(blocks, gap.sessionId, gap.index),
    };
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
  const target = resolveTargetSession(options.blocks, over, pointerY);
  if (!target) return;
  const result = computeBlockMove(
    options.blocks,
    activeBlockId,
    target.sessionId,
    target.overBlockId,
    target.insertAfter,
  );
  if (!result) return;
  markCommitted();
  options.setBlocks(result.blocks);
  reportIfFailed(onError, await options.reorderBlocksAction(result.updates));
}

/** Splits an already-placed exercise row out into a brand-new block at a
 * specific session position — the block-exercise counterpart of
 * createBlockForExercise below, moving the row out of its source block via
 * computeExerciseMove instead of adding a fresh row through
 * addExerciseToBlockAction. */
async function splitExerciseIntoNewBlock(
  options: UseBlockExerciseDndOptions,
  activeExerciseId: string,
  sourceBlockId: string,
  sessionId: string,
  overBlockId: string | null,
  insertAfter: boolean,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.createBlockAction) return;
  const sourceBlock = options.blocks.find((b) => b.id === sourceBlockId);
  const movingRow = sourceBlock?.exercises.find(
    (e) => e.id === activeExerciseId,
  );
  if (!movingRow) return;

  markCommitted();
  const originalBlocks = options.blocks;

  // Show the split immediately: the row disappears from its source block and
  // a pending block holding a copy of it appears at the drop position, while
  // the two round trips below resolve — otherwise the exercise would
  // flash in both places at once.
  const withoutRow = originalBlocks.map((b) =>
    b.id === sourceBlockId
      ? {
          ...b,
          exercises: b.exercises.filter((e) => e.id !== activeExerciseId),
        }
      : b,
  );
  const pendingBlock = createPendingBlock(sessionId, movingRow.exercise);
  options.setBlocks(
    placeBlock(withoutRow, sessionId, overBlockId, insertAfter, pendingBlock)
      .blocks,
  );

  const blockResult = await options.createBlockAction(sessionId, "New block");
  if (!blockResult.ok || !blockResult.data) {
    options.setBlocks(originalBlocks);
    reportIfFailed(onError, blockResult);
    return;
  }

  const newBlockId = blockResult.data.id;
  const withNewBlock = [
    ...originalBlocks,
    { ...blockResult.data, exercises: [] },
  ];
  const moved = computeExerciseMove(
    withNewBlock,
    activeExerciseId,
    sourceBlockId,
    newBlockId,
    null,
    false,
  );
  const newBlockWithExercise = moved?.blocks.find((b) => b.id === newBlockId);
  if (!moved || !newBlockWithExercise) {
    options.setBlocks(originalBlocks);
    return;
  }

  const rest = moved.blocks.filter((b) => b.id !== newBlockId);
  const placed = placeBlock(
    rest,
    sessionId,
    overBlockId,
    insertAfter,
    newBlockWithExercise,
  );
  options.setBlocks(placed.blocks);
  reportIfFailed(
    onError,
    await options.reorderBlockExercisesAction(moved.updates),
  );
  if (placed.updates.length > 0 && options.reorderBlocksAction) {
    reportIfFailed(onError, await options.reorderBlocksAction(placed.updates));
  }
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
  if (!sourceBlockId) return;

  const overParsed = parseId(String(over.id));
  if (overParsed?.type === "gap") {
    const gap = parseGapId(String(over.id));
    if (!gap) return;
    const position = resolveGapBlockPosition(
      options.blocks,
      gap.sessionId,
      gap.index,
    );
    await splitExerciseIntoNewBlock(
      options,
      activeExerciseId,
      sourceBlockId,
      gap.sessionId,
      position.overBlockId,
      position.insertAfter,
      markCommitted,
      onError,
    );
    return;
  }

  const target = resolveExerciseTarget(
    options.blocks,
    over,
    pointerY,
    activeExerciseId,
  );
  if (!target) return;

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

/** Creates a new block — pre-populated with the dragged exercise — at a
 * specific session position (`overBlockId`/`insertAfter`, both null/false to
 * append at the end), showing it immediately as a pending placeholder while
 * the two round trips (create block, then add the exercise) resolve. Powers
 * both the "+ Add block" zone (always appends) and dropping a library
 * exercise on a between-blocks gap (inserts at that exact position). */
async function createBlockForExercise(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  exercise: ExerciseWithDetails,
  sessionId: string,
  overBlockId: string | null,
  insertAfter: boolean,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.createBlockAction) return;
  markCommitted();

  const originalBlocks = options.blocks;
  const pendingBlock = createPendingBlock(sessionId, exercise);
  options.setBlocks(
    placeBlock(
      originalBlocks,
      sessionId,
      overBlockId,
      insertAfter,
      pendingBlock,
    ).blocks,
  );

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
  const realBlock = { ...blockResult.data, exercises };
  const placed = placeBlock(
    originalBlocks,
    sessionId,
    overBlockId,
    insertAfter,
    realBlock,
  );
  options.setBlocks(placed.blocks);
  if (placed.updates.length > 0 && options.reorderBlocksAction) {
    reportIfFailed(onError, await options.reorderBlocksAction(placed.updates));
  }
}

/** Adds a library exercise into an existing block, at a specific row (or the
 * front, if dropped on the block header) — the "normal" case of
 * handleLibraryDrop, split out to keep that function within line-count
 * limits. */
async function placeLibraryExerciseInBlock(
  options: UseBlockExerciseDndOptions,
  exerciseId: string,
  exercise: ExerciseWithDetails,
  target: ExerciseTarget,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
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
    await createBlockForExercise(
      options,
      exerciseId,
      exercise,
      overParsed.value,
      null,
      false,
      markCommitted,
      onError,
    );
    return;
  }
  if (overParsed?.type === "gap") {
    const gap = parseGapId(String(over.id));
    if (!gap) return;
    const position = resolveGapBlockPosition(
      options.blocks,
      gap.sessionId,
      gap.index,
    );
    await createBlockForExercise(
      options,
      exerciseId,
      exercise,
      gap.sessionId,
      position.overBlockId,
      position.insertAfter,
      markCommitted,
      onError,
    );
    return;
  }

  const target = resolveExerciseTarget(options.blocks, over, pointerY);
  if (!target) return;
  await placeLibraryExerciseInBlock(
    options,
    exerciseId,
    exercise,
    target,
    markCommitted,
    onError,
  );
}

/** Appends `newBlocks` to their (already-correct) session, then — if dropped
 * over a specific sibling rather than at the end — repositions them there,
 * one at a time, so their relative order among themselves is preserved
 * immediately after the drop target. Mirrors placeExercise's append-then-move
 * shape so both the pending placeholders and the eventual real blocks land in
 * the same spot without a visible jump. */
function placeBlocks(
  blocks: BlockWithExercises[],
  sessionId: string,
  overBlockId: string | null,
  insertAfter: boolean,
  newBlocks: BlockWithExercises[],
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } {
  const appended = [...blocks, ...newBlocks];
  if (!overBlockId) return { blocks: appended, updates: [] };

  let current = appended;
  let updates: BlockPositionUpdate[] = [];
  let anchor = overBlockId;
  let anchorInsertAfter = insertAfter;
  for (const block of newBlocks) {
    const moved = computeBlockMove(
      current,
      block.id,
      sessionId,
      anchor,
      anchorInsertAfter,
    );
    if (moved) {
      current = moved.blocks;
      updates = moved.updates;
    }
    anchor = block.id;
    anchorInsertAfter = true;
  }
  return { blocks: current, updates };
}

/** Single-block convenience wrapper around placeBlocks. */
function placeBlock(
  blocks: BlockWithExercises[],
  sessionId: string,
  overBlockId: string | null,
  insertAfter: boolean,
  block: BlockWithExercises,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } {
  return placeBlocks(blocks, sessionId, overBlockId, insertAfter, [block]);
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
  const target = resolveTargetSession(options.blocks, over, pointerY);
  if (!target) return;

  markCommitted();
  const originalBlocks = options.blocks;

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
      target.insertAfter,
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
    target.insertAfter,
    result.data,
  );
  options.setBlocks(placed.blocks);
  if (placed.updates.length > 0 && options.reorderBlocksAction) {
    reportIfFailed(onError, await options.reorderBlocksAction(placed.updates));
  }
}

/** Copies every block of a multi-block Block Library template into new
 * blocks wherever it's dropped — mirrors handleBlockTemplateDrop, but shows
 * (and later swaps in) one pending block per source block instead of just
 * one, so the whole template's blocks appear together, in order, immediately
 * on drop. */
async function handleSessionTemplateDrop(
  options: UseBlockExerciseDndOptions,
  sessionTemplateId: string,
  pointerY: number | null,
  over: Over,
  markCommitted: () => void,
  onError: (message: string) => void,
) {
  if (!options.createBlocksFromSessionTemplateAction) return;
  const target = resolveTargetSession(options.blocks, over, pointerY);
  if (!target) return;

  const template = options.sessionTemplatesById?.get(sessionTemplateId);
  if (!template || template.blocks.length === 0) return;

  markCommitted();
  const originalBlocks = options.blocks;

  const pendingBlocks = createPendingBlocksFromSessionTemplate(
    target.sessionId,
    template.blocks,
  );
  options.setBlocks(
    placeBlocks(
      originalBlocks,
      target.sessionId,
      target.overBlockId,
      target.insertAfter,
      pendingBlocks,
    ).blocks,
  );

  const result = await options.createBlocksFromSessionTemplateAction({
    session_id: target.sessionId,
    session_template_id: sessionTemplateId,
  });
  if (!result.ok || !result.data) {
    options.setBlocks(originalBlocks);
    reportIfFailed(onError, result);
    return;
  }

  const placed = placeBlocks(
    originalBlocks,
    target.sessionId,
    target.overBlockId,
    target.insertAfter,
    result.data,
  );
  options.setBlocks(placed.blocks);
  if (placed.updates.length > 0 && options.reorderBlocksAction) {
    reportIfFailed(onError, await options.reorderBlocksAction(placed.updates));
  }
}

/** Wraps blockDndCollision to capture the exact pointer coordinates dnd-kit
 * used to resolve `over` on this pass, into `pointerYRef` — reading them
 * straight from collision detection (rather than reconstructing current
 * pointer position from `activatorEvent.clientY + delta.y`, which drifted
 * from the coordinates collision detection actually compared `over.rect`
 * against, occasionally flipping which half of a hovered block looked
 * active) guarantees the two stay in lockstep, since both come from the
 * same pass. */
function createCollisionDetection(pointerYRef: {
  current: number | null;
}): CollisionDetection {
  return (args) => {
    pointerYRef.current = args.pointerCoordinates?.y ?? null;
    return blockDndCollision(args);
  };
}

function createDragStartHandler(
  setActiveId: (value: string | null) => void,
  setSuppressDropAnimation: (value: boolean) => void,
) {
  return (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSuppressDropAnimation(false);
  };
}

function createDragMoveHandler(
  pointerYRef: { current: number | null },
  setPointerY: (value: number | null) => void,
  setDropTarget: (value: { overId: string; after: boolean } | null) => void,
) {
  return (event: DragMoveEvent) => {
    const { over } = event;
    const pointerY = pointerYRef.current;
    setPointerY(pointerY);
    if (!over) {
      setDropTarget(null);
      return;
    }
    setDropTarget({
      overId: String(over.id),
      after: isInsertAfter(pointerY, over),
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
    } else if (activeParsed.type === "session-template") {
      await handleSessionTemplateDrop(
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

  // Read fresh in createCollisionDetection on every collision pass — see its
  // comment for why this is more reliable than reconstructing pointer
  // position from the drag event.
  const pointerYRef = useRef<number | null>(null);
  const collisionDetection = useMemo(
    () => createCollisionDetection(pointerYRef),
    [],
  );

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
    setSuppressDropAnimation,
  );
  const handleDragMove = createDragMoveHandler(
    pointerYRef,
    setPointerY,
    setDropTarget,
  );
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
    collisionDetection,
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
