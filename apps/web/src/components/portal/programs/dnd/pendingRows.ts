import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";

/**
 * A locally-created row shown while its create request is still in flight —
 * it has no real server id yet, so it's never persisted and disappears on
 * reload if the tab closes mid-request. `pending` marks it so the UI can
 * dim it and block editing until the real row swaps in.
 */
export type Pending<T> = T & { pending: true };

// `row` is typed `unknown` rather than `{ pending?: boolean }` — the real
// (non-pending) row types don't declare that field at all, and TypeScript's
// weak-type check rejects an argument with zero overlapping properties.
export function isPending(row: unknown): boolean {
  return (
    typeof row === "object" &&
    row !== null &&
    (row as { pending?: boolean }).pending === true
  );
}

let pendingSequence = 0;

function nextPendingId(prefix: string): string {
  pendingSequence += 1;
  return `pending:${prefix}:${Date.now()}:${pendingSequence}`;
}

export function createPendingExercise(
  blockId: string,
  exercise: ExerciseWithDetails,
): Pending<BlockExerciseWithDetails> {
  const now = new Date().toISOString();
  return {
    id: nextPendingId("exercise"),
    block_id: blockId,
    exercise_id: exercise.id,
    position: 0,
    sets: 1,
    notes: null,
    link_group_id: null,
    created_at: now,
    updated_at: now,
    exercise,
    measurements: [],
    pending: true,
  };
}

export function createPendingBlock(
  sessionId: string,
  exercise: ExerciseWithDetails,
): Pending<BlockWithExercises> {
  const id = nextPendingId("block");
  const now = new Date().toISOString();
  return {
    id,
    session_id: sessionId,
    name: "New block",
    color: defaultBlockColor("New block"),
    position: 0,
    link_group_id: null,
    created_at: now,
    updated_at: now,
    exercises: [createPendingExercise(id, exercise)],
    pending: true,
  };
}

/** Placeholder shown while a Block Library template is being copied into a
 * new block (its exercises/measurements come back in one round trip, so
 * there's nothing to preview row-by-row — just the block itself, pending). */
export function createPendingBlockFromTemplate(
  sessionId: string,
  name: string,
): Pending<BlockWithExercises> {
  const now = new Date().toISOString();
  return {
    id: nextPendingId("block-template"),
    session_id: sessionId,
    name,
    color: defaultBlockColor(name),
    position: 0,
    link_group_id: null,
    created_at: now,
    updated_at: now,
    exercises: [],
    pending: true,
  };
}

/** Placeholders shown while a multi-block session template is being copied
 * in — one pending block per source block, so every block in the template
 * appears (dimmed, with a spinner) immediately on drop rather than just the
 * first one. */
export function createPendingBlocksFromSessionTemplate(
  sessionId: string,
  blocks: { name: string }[],
): Pending<BlockWithExercises>[] {
  return blocks.map((b) => createPendingBlockFromTemplate(sessionId, b.name));
}
