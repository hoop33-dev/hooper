import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
} from "@hooper/db";

export function patchBlock(
  blocks: BlockWithExercises[],
  blockId: string,
  patch: Partial<BlockRow>,
): BlockWithExercises[] {
  return blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b));
}

export function removeBlock(
  blocks: BlockWithExercises[],
  blockId: string,
): BlockWithExercises[] {
  return blocks.filter((b) => b.id !== blockId);
}

export function patchExercise(
  blocks: BlockWithExercises[],
  exerciseRowId: string,
  patch: Partial<BlockExerciseWithDetails>,
): BlockWithExercises[] {
  return blocks.map((b) => ({
    ...b,
    exercises: b.exercises.map((e) =>
      e.id === exerciseRowId ? { ...e, ...patch } : e,
    ),
  }));
}

export function removeExercise(
  blocks: BlockWithExercises[],
  exerciseRowId: string,
): BlockWithExercises[] {
  return blocks.map((b) => ({
    ...b,
    exercises: b.exercises.filter((e) => e.id !== exerciseRowId),
  }));
}
