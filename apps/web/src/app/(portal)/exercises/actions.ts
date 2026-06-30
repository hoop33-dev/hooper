"use server";

import { revalidatePath } from "next/cache";
import {
  createExercise,
  updateExercise,
  deleteExercise,
  updateExerciseVideoUrl,
} from "@/src/services/exercise.service";
import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";

type ActionResult = { ok: boolean; error?: string; data?: unknown };

export async function createExerciseAction(
  data: ExerciseFormData & { created_by: string },
): Promise<ActionResult> {
  const result = await createExercise({
    name: data.name,
    description: data.description,
    categoryIds: data.categoryIds,
    unitTypes: data.unitTypes,
    created_by: data.created_by,
  });
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error };
}

export async function updateExerciseAction(
  id: string,
  data: ExerciseFormData,
): Promise<ActionResult> {
  const result = await updateExercise(id, {
    name: data.name,
    description: data.description,
    categoryIds: data.categoryIds,
    unitTypes: data.unitTypes,
  });
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error };
}

export async function deleteExerciseAction(id: string): Promise<ActionResult> {
  const result = await deleteExercise(id);
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function updateExerciseVideoUrlAction(
  id: string,
  videoUrl: string,
): Promise<ActionResult> {
  const result = await updateExerciseVideoUrl(id, videoUrl);
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
