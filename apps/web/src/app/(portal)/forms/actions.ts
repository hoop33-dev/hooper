"use server";

import {
  createForm,
  deleteForm,
  updateForm,
  type CreateFormInput,
  type UpdateFormInput,
} from "@/src/services/form.service";
import type { FormRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export async function createFormAction(
  data: CreateFormInput,
): Promise<ActionResult<FormRow>> {
  const result = await createForm(data);
  if (result.ok) revalidatePath("/forms");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateFormAction(
  id: string,
  data: UpdateFormInput,
): Promise<ActionResult<FormRow>> {
  const result = await updateForm(id, data);
  if (result.ok) revalidatePath("/forms");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteFormAction(id: string): Promise<ActionResult> {
  const result = await deleteForm(id);
  if (result.ok) revalidatePath("/forms");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
