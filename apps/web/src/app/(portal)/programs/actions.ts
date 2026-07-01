"use server";

import {
  createProgram,
  deleteProgram,
  publishProgram,
  updateProgram,
  type CreateProgramInput,
  type UpdateProgramInput,
} from "@/src/services/program.service";
import type { ProgramRow } from "@hooper/db";
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
