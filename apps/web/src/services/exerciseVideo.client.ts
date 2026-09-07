import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient as createBrowserClient } from "@/src/lib/supabase/client";

/**
 * Uploads directly from the browser (not a server action) so the request
 * carries the user's real session cookies — storage RLS on exercise-videos
 * checks get_auth_profile_id(), which needs an authenticated request.
 */
export async function uploadExerciseVideo(
  exerciseId: string,
  file: File,
  profileId: string,
): Promise<Result<string>> {
  try {
    const supabase = createBrowserClient();
    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${profileId}/${exerciseId}/demo.${ext}`;

    const { error } = await supabase.storage
      .from("exercise-videos")
      .upload(path, file, { upsert: true });

    if (error) return err(error.message);

    const { data } = supabase.storage
      .from("exercise-videos")
      .getPublicUrl(path);

    return ok(data.publicUrl);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/**
 * Uploads a captured video-frame thumbnail (see videoThumbnailCapture.ts)
 * to its own bucket — kept separate from exercise-videos since it's a much
 * smaller, differently-typed (image) object with its own storage policies.
 */
export async function uploadExerciseVideoThumbnail(
  exerciseId: string,
  thumbnail: Blob,
  profileId: string,
): Promise<Result<string>> {
  try {
    const supabase = createBrowserClient();
    const path = `${profileId}/${exerciseId}/thumbnail.jpg`;

    const { error } = await supabase.storage
      .from("exercise-video-thumbnails")
      .upload(path, thumbnail, { upsert: true, contentType: "image/jpeg" });

    if (error) return err(error.message);

    const { data } = supabase.storage
      .from("exercise-video-thumbnails")
      .getPublicUrl(path);

    return ok(data.publicUrl);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Mirrors deleteExerciseVideo but for the thumbnails bucket — called
 * alongside it whenever an upload is replaced, removed, or the exercise
 * itself is deleted. */
export async function deleteExerciseVideoThumbnail(
  exerciseId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = createBrowserClient();
    const folder = `${profileId}/${exerciseId}`;

    const { data, error: listError } = await supabase.storage
      .from("exercise-video-thumbnails")
      .list(folder);
    if (listError) return err(listError.message);
    if (!data || data.length === 0) return ok(undefined);

    const paths = data.map((file) => `${folder}/${file.name}`);
    const { error } = await supabase.storage
      .from("exercise-video-thumbnails")
      .remove(paths);
    if (error) return err(error.message);

    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/**
 * Removes every object under the exercise's storage folder. Called whenever a
 * stored upload is being replaced or removed, so switching to a link (or a
 * new file with a different extension) doesn't leave the old file orphaned.
 */
export async function deleteExerciseVideo(
  exerciseId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = createBrowserClient();
    const folder = `${profileId}/${exerciseId}`;

    const { data, error: listError } = await supabase.storage
      .from("exercise-videos")
      .list(folder);
    if (listError) return err(listError.message);
    if (!data || data.length === 0) return ok(undefined);

    const paths = data.map((file) => `${folder}/${file.name}`);
    const { error } = await supabase.storage
      .from("exercise-videos")
      .remove(paths);
    if (error) return err(error.message);

    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
