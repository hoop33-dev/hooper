"use server";

import type {
  BlockExercisePositionUpdate,
  BlockPositionUpdate,
} from "@/src/components/portal/programs/dnd/dropComputation";
import {
  addExerciseToBlock,
  createBlock,
  deleteBlock,
  removeExerciseFromBlock,
  reorderBlockExercises,
  reorderBlocks,
  updateBlock,
  updateBlockExercise,
  type AddExerciseToBlockInput,
  type CreateBlockInput,
  type UpdateBlockExerciseInput,
  type UpdateBlockInput,
} from "@/src/services/block.service";
import {
  createSession,
  deleteSession,
  duplicateSession,
  reorderSessions,
  updateSessionName,
  type CreateSessionInput,
  type DuplicateSessionInput,
} from "@/src/services/session.service";
import type { BlockExerciseRow, BlockRow, SessionRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function revalidateProgramRoutes() {
  revalidatePath("/programs", "page");
  revalidatePath("/programs/[id]", "page");
  revalidatePath("/programs/[id]/sessions/[sessionId]", "page");
}

export async function createSessionAction(
  input: CreateSessionInput,
): Promise<ActionResult<SessionRow>> {
  const result = await createSession(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateSessionNameAction(
  id: string,
  name: string,
): Promise<ActionResult<SessionRow>> {
  const result = await updateSessionName(id, name);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteSessionAction(id: string): Promise<ActionResult> {
  const result = await deleteSession(id);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function duplicateSessionAction(
  input: DuplicateSessionInput,
): Promise<ActionResult<SessionRow[]>> {
  const result = await duplicateSession(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function reorderSessionsAction(
  updates: { id: string; week_number: number; position: number }[],
): Promise<ActionResult> {
  const result = await reorderSessions(updates);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function createBlockAction(
  input: CreateBlockInput,
): Promise<ActionResult<BlockRow>> {
  const result = await createBlock(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateBlockAction(
  id: string,
  input: UpdateBlockInput,
): Promise<ActionResult<BlockRow>> {
  const result = await updateBlock(id, input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteBlockAction(id: string): Promise<ActionResult> {
  const result = await deleteBlock(id);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderBlocksAction(
  updates: BlockPositionUpdate[],
): Promise<ActionResult> {
  const result = await reorderBlocks(updates);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addExerciseToBlockAction(
  input: AddExerciseToBlockInput,
): Promise<ActionResult<BlockExerciseRow>> {
  const result = await addExerciseToBlock(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateBlockExerciseAction(
  id: string,
  input: UpdateBlockExerciseInput,
): Promise<ActionResult<BlockExerciseRow>> {
  const result = await updateBlockExercise(id, input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function removeExerciseFromBlockAction(
  id: string,
): Promise<ActionResult> {
  const result = await removeExerciseFromBlock(id);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderBlockExercisesAction(
  updates: BlockExercisePositionUpdate[],
): Promise<ActionResult> {
  const result = await reorderBlockExercises(updates);
  if (result.ok) revalidateProgramRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
