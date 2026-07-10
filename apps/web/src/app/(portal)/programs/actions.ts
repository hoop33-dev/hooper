"use server";

import {
  createProgram,
  deleteProgram,
  getProgramById,
  publishProgram,
  updateProgram,
  type CreateProgramInput,
  type UpdateProgramInput,
} from "@/src/services/program.service";
import type { ProgramRow, ProgramWithSessions } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export async function createProgramAction(
  data: CreateProgramInput,
): Promise<ActionResult<ProgramRow>> {
  const result = await createProgram(data);
  if (result.ok) revalidatePath("/programs");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateProgramAction(
  id: string,
  data: UpdateProgramInput,
): Promise<ActionResult<ProgramRow>> {
  const result = await updateProgram(id, data);
  if (result.ok) revalidatePath("/programs");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteProgramAction(id: string): Promise<ActionResult> {
  const result = await deleteProgram(id);
  if (result.ok) revalidatePath("/programs");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function publishProgramAction(
  id: string,
): Promise<ActionResult<ProgramRow>> {
  const result = await publishProgram(id);
  if (result.ok) revalidatePath("/programs");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

/** Fetches an arbitrary program's full week/session tree — used to preview
 * a source program's weeks in the "import weeks" picker. Not scoped to the
 * program currently being edited, so it lives here rather than in
 * `[id]/actions.ts`. */
export async function getImportSourceProgramAction(
  id: string,
): Promise<ActionResult<ProgramWithSessions>> {
  const result = await getProgramById(id);
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}
