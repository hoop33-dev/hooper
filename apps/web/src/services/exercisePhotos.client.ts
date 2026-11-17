import { EXERCISE_PHOTOS_BUCKET } from "@/src/lib/exercisePhotos";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient as createBrowserClient } from "@/src/lib/supabase/client";

/**
 * Uploads directly from the browser (like exerciseVideo.client.ts) so storage
 * RLS sees the user's session. Each photo gets a fresh random name, so a
 * replaced photo never collides with (or is cached as) the old one. Returns
 * the storage path — the server derives the public URL from it.
 */
export async function uploadExercisePhoto(
  exerciseId: string,
  photo: Blob,
  profileId: string,
): Promise<Result<string>> {
  try {
    const supabase = createBrowserClient();
    const path = `${profileId}/${exerciseId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from(EXERCISE_PHOTOS_BUCKET)
      .upload(path, photo, { contentType: "image/jpeg" });
    if (error) return err(error.message);
    return ok(path);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Removes specific photo files — the ones a save dropped or replaced. */
export async function deleteExercisePhotoFiles(
  paths: string[],
): Promise<Result<void>> {
  if (paths.length === 0) return ok(undefined);
  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.storage
      .from(EXERCISE_PHOTOS_BUCKET)
      .remove(paths);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Removes every photo file under the exercise's folder — called after the
 * exercise itself is deleted (its rows cascade away with it). */
export async function deleteAllExercisePhotos(
  exerciseId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = createBrowserClient();
    const folder = `${profileId}/${exerciseId}`;
    const { data, error } = await supabase.storage
      .from(EXERCISE_PHOTOS_BUCKET)
      .list(folder);
    if (error) return err(error.message);
    return deleteExercisePhotoFiles(
      (data ?? []).map((file) => `${folder}/${file.name}`),
    );
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
