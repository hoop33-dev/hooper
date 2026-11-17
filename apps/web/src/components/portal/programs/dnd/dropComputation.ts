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

function resolveInsertIndex(
  list: { id: string }[],
  overId: string | null,
  insertAfter: boolean,
): number {
  if (!overId) return list.length;
  const idx = list.findIndex((item) => item.id === overId);
  if (idx === -1) return list.length;
  return idx + (insertAfter ? 1 : 0);
}

function sameOrder(a: { id: string }[], b: { id: string }[]): boolean {
  return a.length === b.length && a.every((item, i) => item.id === b[i].id);
}

/**
 * Moves a whole block within its session, or into a different session (the
 * program canvas can show several sessions' blocks at once; the session
 * view only ever passes blocks from one session, so `targetSessionId`
 * there always matches the dragged block's own session). `insertAfter`
 * drops below the `overBlockId` target rather than above it.
 */
export function computeBlockMove(
  blocks: BlockWithExercises[],
  activeBlockId: string,
  targetSessionId: string,
  overBlockId: string | null,
  insertAfter = false,
): { blocks: BlockWithExercises[]; updates: BlockPositionUpdate[] } | null {
  const active = blocks.find((b) => b.id === activeBlockId);
  if (!active || overBlockId === activeBlockId) return null;

  const sameSession = active.session_id === targetSessionId;
  const sourceRemaining = blocks.filter(
    (b) => b.session_id === active.session_id && b.id !== activeBlockId,
  );
  const targetBase = sameSession
    ? sourceRemaining
    : blocks.filter((b) => b.session_id === targetSessionId);

  const insertIndex = resolveInsertIndex(targetBase, overBlockId, insertAfter);
  const newTarget = [...targetBase];
  newTarget.splice(insertIndex, 0, { ...active, session_id: targetSessionId });

  // No-op: dropped back into its original slot.
  const originalTarget = blocks.filter((b) => b.session_id === targetSessionId);
  if (sameSession && sameOrder(newTarget, originalTarget)) return null;

  const resequencedTarget = newTarget.map((b, i) => ({ ...b, position: i }));
  const resequencedSource = sameSession
    ? resequencedTarget
    : sourceRemaining.map((b, i) => ({ ...b, position: i }));
  const untouched = blocks.filter(
    (b) =>
      b.session_id !== targetSessionId &&
      (sameSession || b.session_id !== active.session_id),
  );

  const toUpdate = (b: BlockWithExercises) => ({
    id: b.id,
    session_id: b.session_id,
    position: b.position,
  });
  return {
    blocks: [
      ...untouched,
      ...resequencedTarget,
      ...(sameSession ? [] : resequencedSource),
    ],
    updates: [
      ...resequencedTarget.map(toUpdate),
      ...(sameSession ? [] : resequencedSource.map(toUpdate)),
    ],
  };
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
  insertAfter = false,
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

  const insertIndex = resolveInsertIndex(
    targetExercises,
    overExerciseId,
    insertAfter,
  );
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
