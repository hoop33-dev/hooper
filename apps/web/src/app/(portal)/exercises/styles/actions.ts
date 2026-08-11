"use server";

import {
  createStyle,
  deleteStyle,
  updateStyle,
} from "@/src/services/exerciseStyle.service";
import type { ExerciseStyleRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string; data?: ExerciseStyleRow };

export async function createStyleAction(data: {
  name: string;
  description?: string;
  created_by: string;
}): Promise<ActionResult> {
  const result = await createStyle(data);
  if (result.ok) {
    revalidatePath("/exercises/styles");
    revalidatePath("/exercises");
  }
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateStyleAction(
  id: string,
  data: { name?: string; description?: string },
): Promise<ActionResult> {
  const result = await updateStyle(id, data);
  if (result.ok) {
    revalidatePath("/exercises/styles");
    revalidatePath("/exercises");
  }
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteStyleAction(id: string): Promise<ActionResult> {
  const result = await deleteStyle(id);
  if (result.ok) {
    revalidatePath("/exercises/styles");
    revalidatePath("/exercises");
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
