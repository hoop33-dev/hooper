"use server";

import {
  createFormQuestion,
  deleteFormQuestion,
  reorderFormQuestions,
  updateFormQuestion,
  type CreateFormQuestionInput,
  type UpdateFormQuestionInput,
} from "@/src/services/form.service";
import type { FormQuestionRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function revalidateFormRoutes() {
  revalidatePath("/forms", "page");
  revalidatePath("/forms/[id]", "page");
}

export async function createFormQuestionAction(
  input: CreateFormQuestionInput,
): Promise<ActionResult<FormQuestionRow>> {
  const result = await createFormQuestion(input);
  if (result.ok) revalidateFormRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateFormQuestionAction(
  id: string,
  input: UpdateFormQuestionInput,
): Promise<ActionResult<FormQuestionRow>> {
  const result = await updateFormQuestion(id, input);
  if (result.ok) revalidateFormRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteFormQuestionAction(
  id: string,
): Promise<ActionResult> {
  const result = await deleteFormQuestion(id);
  if (result.ok) revalidateFormRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function reorderFormQuestionsAction(
  updates: { id: string; position: number }[],
): Promise<ActionResult> {
  const result = await reorderFormQuestions(updates);
  if (result.ok) revalidateFormRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
