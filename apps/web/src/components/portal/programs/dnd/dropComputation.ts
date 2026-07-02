import { arrayMove } from "@dnd-kit/sortable";
import type { BlockWithExercises } from "@hooper/db";

export type BlockExercisePositionUpdate = {
  id: string;
  block_id: string;
  position: number;
};
export type BlockPositionUpdate = {
  id: string;
  session_id: string;
  position: number;
};

function computeSameSessionBlockReorder(
  blocks: BlockWithExercises[],
  activeBlockId: string,
  sessionId: string,
  overBlockId: string | null,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } | null {
  const sessionBlocks = blocks.filter((b) => b.session_id === sessionId);
  const oldIndex = sessionBlocks.findIndex((b) => b.id === activeBlockId);
  const newIndex = overBlockId
    ? sessionBlocks.findIndex((b) => b.id === overBlockId)
    : sessionBlocks.length - 1;
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null;

  const reordered = arrayMove(sessionBlocks, oldIndex, newIndex).map(
    (b, i) => ({ ...b, position: i }),
  );
  const otherBlocks = blocks.filter((b) => b.session_id !== sessionId);
  return {
    blocks: [...otherBlocks, ...reordered],
    updates: reordered.map((b) => ({
      id: b.id,
      session_id: b.session_id,
      position: b.position,
    })),
  };
}

function computeCrossSessionBlockMove(
  blocks: BlockWithExercises[],
  active: BlockWithExercises,
  targetSessionId: string,
  overBlockId: string | null,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } {
  const sourceRemaining = blocks.filter(
    (b) => b.session_id === active.session_id && b.id !== active.id,
  );
  const targetList = blocks.filter((b) => b.session_id === targetSessionId);

  let insertIndex = targetList.length;
  if (overBlockId) {
    const idx = targetList.findIndex((b) => b.id === overBlockId);
    if (idx !== -1) insertIndex = idx;
  }
  const newTargetList = [...targetList];
  newTargetList.splice(insertIndex, 0, {
    ...active,
    session_id: targetSessionId,
  });
  const resequencedTarget = newTargetList.map((b, i) => ({
    ...b,
    position: i,
  }));
  const resequencedSource = sourceRemaining.map((b, i) => ({
    ...b,
    position: i,
  }));

  const untouchedBlocks = blocks.filter(
    (b) =>
      b.session_id !== targetSessionId && b.session_id !== active.session_id,
  );
  return {
    blocks: [...untouchedBlocks, ...resequencedTarget, ...resequencedSource],
    updates: [
      ...resequencedTarget.map((b) => ({
        id: b.id,
        session_id: b.session_id,
        position: b.position,
      })),
      ...resequencedSource.map((b) => ({
        id: b.id,
        session_id: b.session_id,
        position: b.position,
      })),
    ],
  };
}

/**
 * Moves a whole block within its session, or into a different session (the
 * program canvas can show several sessions' blocks at once; the session
 * view only ever passes blocks from one session, so `targetSessionId`
 * there always matches the dragged block's own session).
 */
export function computeBlockMove(
  blocks: BlockWithExercises[],
  activeBlockId: string,
  targetSessionId: string,
  overBlockId: string | null,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } | null {
  const active = blocks.find((b) => b.id === activeBlockId);
  if (!active) return null;

  if (active.session_id === targetSessionId) {
    return computeSameSessionBlockReorder(
      blocks,
      activeBlockId,
      targetSessionId,
      overBlockId,
    );
  }
  return computeCrossSessionBlockMove(
    blocks,
    active,
    targetSessionId,
    overBlockId,
  );
}

/**
 * Moves a placed exercise within the same block, or across two blocks.
 * Resequences positions for every affected block's exercise list.
 */
export function computeExerciseMove(
  blocks: BlockWithExercises[],
  activeExerciseId: string,
  sourceBlockId: string,
  targetBlockId: string,
  overExerciseId: string | null,
): {
  blocks: BlockWithExercises[];
  updates: BlockExercisePositionUpdate[];
} | null {
  const sourceBlock = blocks.find((b) => b.id === sourceBlockId);
  const targetBlock = blocks.find((b) => b.id === targetBlockId);
  if (!sourceBlock || !targetBlock) return null;

  const moved = sourceBlock.exercises.find((e) => e.id === activeExerciseId);
  if (!moved) return null;

  const sameBlock = sourceBlockId === targetBlockId;
  const sourceRemaining = sourceBlock.exercises.filter(
    (e) => e.id !== activeExerciseId,
  );
  const targetExercises = sameBlock
    ? [...sourceRemaining]
    : [...targetBlock.exercises.filter((e) => e.id !== activeExerciseId)];

  let insertIndex = targetExercises.length;
  if (overExerciseId) {
    const idx = targetExercises.findIndex((e) => e.id === overExerciseId);
    if (idx !== -1) insertIndex = idx;
  }
  targetExercises.splice(insertIndex, 0, { ...moved, block_id: targetBlockId });

  const resequencedTarget = targetExercises.map((e, i) => ({
    ...e,
    position: i,
  }));
  const resequencedSource = sameBlock
    ? resequencedTarget
    : sourceRemaining.map((e, i) => ({ ...e, position: i }));

  const newBlocks = blocks.map((b) => {
    if (b.id === targetBlockId) return { ...b, exercises: resequencedTarget };
    if (!sameBlock && b.id === sourceBlockId)
      return { ...b, exercises: resequencedSource };
    return b;
  });

  const updates: BlockExercisePositionUpdate[] = [
    ...resequencedTarget.map((e) => ({
      id: e.id,
      block_id: targetBlockId,
      position: e.position,
    })),
    ...(sameBlock
      ? []
      : resequencedSource.map((e) => ({
          id: e.id,
          block_id: sourceBlockId,
          position: e.position,
        }))),
  ];

  return { blocks: newBlocks, updates };
}
