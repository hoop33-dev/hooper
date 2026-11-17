"use server";

import { getCoachProfileId } from "@/src/services/auth.service";
import {
  createSequence,
  deleteSequence,
  updateSequence,
  updateSequenceDetails,
  type SequenceInput,
} from "@/src/services/sequence.service";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string; id?: string };

function revalidateSequenceRoutes() {
  revalidatePath("/sequences", "page");
  revalidatePath("/sequences/[id]", "page");
  // The program and session canvases list saved sequences in their shelf.
  revalidatePath("/programs/[id]", "page");
  revalidatePath("/programs/[id]/sessions/[sessionId]", "page");
  revalidatePath("/blocks/[id]", "page");
}

export async function createSequenceAction(
  input: SequenceInput,
): Promise<ActionResult> {
  const profile = await getCoachProfileId();
  if (!profile.ok) return { ok: false, error: profile.error };
  const result = await createSequence(input, profile.data);
  if (result.ok) revalidateSequenceRoutes();
  return result.ok
    ? { ok: true, id: result.data.id }
    : { ok: false, error: result.error };
}

export async function updateSequenceAction(
  id: string,
  input: SequenceInput,
): Promise<ActionResult> {
  const result = await updateSequence(id, input);
  if (result.ok) revalidateSequenceRoutes();
  return result.ok ? { ok: true, id } : { ok: false, error: result.error };
}

export async function updateSequenceDetailsAction(
  id: string,
  details: { name: string; description: string | null },
): Promise<ActionResult> {
  const result = await updateSequenceDetails(id, details);
  if (result.ok) revalidateSequenceRoutes();
  return result.ok ? { ok: true, id } : { ok: false, error: result.error };
}

export async function deleteSequenceAction(id: string): Promise<ActionResult> {
  const result = await deleteSequence(id);
  if (result.ok) revalidateSequenceRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
