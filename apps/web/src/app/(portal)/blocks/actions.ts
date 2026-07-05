"use server";

import type {
  BlockExercisePositionUpdate,
  BlockPositionUpdate,
} from "@/src/components/portal/programs/dnd/dropComputation";
import type {
  AddExerciseToBlockTemplateInput,
  BlockExerciseWithMeasurements,
  CreateBlockFromTemplateInput,
  CreateBlockTemplateInput,
  UpdateBlockTemplateExerciseInput,
  UpdateBlockTemplateInput,
} from "@/src/services/blockTemplate.service";
import {
  addExerciseToBlockTemplate,
  createBlockFromTemplate,
  createBlockTemplate,
  deleteBlockTemplate,
  removeExerciseFromBlockTemplate,
  reorderBlockTemplateExercises,
  reorderBlockTemplates,
  saveBlockAsTemplate,
  updateBlockTemplate,
  updateBlockTemplateExercise,
} from "@/src/services/blockTemplate.service";
import type {
  CreateSessionFromTemplateInput,
  CreateSessionTemplateInput,
} from "@/src/services/sessionTemplate.service";
import {
  createSessionFromTemplate,
  createSessionTemplate,
  deleteSessionTemplate,
  saveSessionAsTemplate,
  updateSessionTemplateName,
} from "@/src/services/sessionTemplate.service";
import type {
  BlockRow,
  BlockWithExercises,
  SessionRow,
  SessionTemplateRow,
} from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function revalidateBlockLibraryRoutes() {
  revalidatePath("/blocks", "page");
  revalidatePath("/blocks/[id]", "page");
}

function revalidateProgramRoutes() {
  revalidatePath("/programs", "page");
  revalidatePath("/programs/[id]", "page");
  revalidatePath("/programs/[id]/sessions/[sessionId]", "page");
}

// ── Session templates (Block Library list page) ────────────────

export async function createSessionTemplateAction(
  input: CreateSessionTemplateInput,
): Promise<ActionResult<SessionTemplateRow>> {
  const result = await createSessionTemplate(input);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateSessionTemplateNameAction(
  id: string,
  name: string,
): Promise<ActionResult> {
  const result = await updateSessionTemplateName(id, name);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function deleteSessionTemplateAction(
  id: string,
): Promise<ActionResult> {
  const result = await deleteSessionTemplate(id);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

// ── Saving a real block/session as a template ───────────────────

export async function saveBlockAsTemplateAction(
  blockId: string,
  name: string,
  createdBy: string,
): Promise<ActionResult> {
  const result = await saveBlockAsTemplate(blockId, name, createdBy);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function saveSessionAsTemplateAction(
  sessionId: string,
  name: string,
  createdBy: string,
): Promise<ActionResult> {
  const result = await saveSessionAsTemplate(sessionId, name, createdBy);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

// ── Pulling a template back into a program ──────────────────────

export async function createBlockFromTemplateAction(
  input: CreateBlockFromTemplateInput,
): Promise<ActionResult<BlockWithExercises>> {
  const result = await createBlockFromTemplate(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function createSessionFromTemplateAction(
  input: CreateSessionFromTemplateInput,
): Promise<ActionResult<SessionRow>> {
  const result = await createSessionFromTemplate(input);
  if (result.ok) revalidateProgramRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

// ── Template editor (SessionViewShell reused against block_templates) ──
// These match SessionViewActions' exact shape (see useSessionViewState.ts)
// so the template editor page can pass them straight to SessionViewShell.

export async function createBlockTemplateAction(
  input: CreateBlockTemplateInput,
): Promise<ActionResult<BlockRow>> {
  const result = await createBlockTemplate(input);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateBlockTemplateAction(
  id: string,
  input: UpdateBlockTemplateInput,
): Promise<ActionResult<BlockRow>> {
  const result = await updateBlockTemplate(id, input);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteBlockTemplateAction(
  id: string,
): Promise<ActionResult> {
  const result = await deleteBlockTemplate(id);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderBlockTemplatesAction(
  updates: BlockPositionUpdate[],
): Promise<ActionResult> {
  const result = await reorderBlockTemplates(
    updates.map(({ id, position }) => ({ id, position })),
  );
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addExerciseToBlockTemplateAction(
  input: AddExerciseToBlockTemplateInput,
): Promise<ActionResult<BlockExerciseWithMeasurements>> {
  const result = await addExerciseToBlockTemplate(input);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateBlockTemplateExerciseAction(
  id: string,
  input: UpdateBlockTemplateExerciseInput,
): Promise<ActionResult<BlockExerciseWithMeasurements>> {
  const result = await updateBlockTemplateExercise(id, input);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function removeExerciseFromBlockTemplateAction(
  id: string,
): Promise<ActionResult> {
  const result = await removeExerciseFromBlockTemplate(id);
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderBlockTemplateExercisesAction(
  updates: BlockExercisePositionUpdate[],
): Promise<ActionResult> {
  const result = await reorderBlockTemplateExercises(
    updates.map(({ id, block_id, position }) => ({
      id,
      block_template_id: block_id,
      position,
    })),
  );
  if (result.ok) revalidateBlockLibraryRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

// Templates never link across weeks, so the measurement modal's "this /
// future / all" scope choice never applies here — always resolve empty.
export async function getLinkedWeeksForTemplateExerciseAction(
  _id: string,
): Promise<ActionResult<number[]>> {
  return { ok: true, data: [] };
}
