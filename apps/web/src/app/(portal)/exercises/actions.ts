"use server";

import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import {
  createExercise,
  deleteExercise,
  updateExercise,
  updateExerciseVideoUrl,
} from "@/src/services/exercise.service";
import type { ExerciseVideoSource } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string; id?: string };

export async function createExerciseAction(
  data: ExerciseFormData & { created_by: string },
): Promise<ActionResult> {
  const result = await createExercise({
    name: data.name,
    description: data.description,
    videoUrl: data.videoUrl,
    videoSource: data.videoSource,
    categoryIds: data.categoryIds,
    unitTypes: data.unitTypes,
    parentId: data.parentId,
    defaultStyleId: data.defaultStyleId,
    created_by: data.created_by,
  });
  if (result.ok) revalidatePath("/exercises");
  return result.ok
    ? { ok: true, id: result.data.id }
    : { ok: false, error: result.error };
}

export async function updateExerciseAction(
  id: string,
  data: ExerciseFormData,
): Promise<ActionResult> {
  const result = await updateExercise(id, {
    name: data.name,
    description: data.description,
    ...("videoUrl" in data
      ? { videoUrl: data.videoUrl, videoSource: data.videoSource }
      : {}),
    categoryIds: data.categoryIds,
    unitTypes: data.unitTypes,
    parentId: data.parentId,
    defaultStyleId: data.defaultStyleId,
  });
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function deleteExerciseAction(id: string): Promise<ActionResult> {
  const result = await deleteExercise(id);
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function updateExerciseVideoUrlAction(
  id: string,
  videoUrl: string,
  videoSource: ExerciseVideoSource,
): Promise<ActionResult> {
  const result = await updateExerciseVideoUrl(id, videoUrl, videoSource);
  if (result.ok) revalidatePath("/exercises");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
