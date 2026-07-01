import { arrayMove } from "@dnd-kit/sortable";
import type { BlockWithExercises } from "@hooper/db";

export type PositionUpdate = { id: string; position: number };
export type BlockExercisePositionUpdate = {
  id: string;
  block_id: string;
  position: number;
};

/** Reorders whole blocks within a session (session-view only). */
export function computeBlockReorder(
  blocks: BlockWithExercises[],
  activeId: string,
  overId: string,
): { blocks: BlockWithExercises[]; updates: PositionUpdate[] } | null {
  const oldIndex = blocks.findIndex((b) => b.id === activeId);
  const newIndex = blocks.findIndex((b) => b.id === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null;

  const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
    ...b,
    position: i,
  }));
  const updates = reordered.map((b, i) => ({ id: b.id, position: i }));
  return { blocks: reordered, updates };
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
