import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient as createBrowserClient } from "@/src/lib/supabase/client";

/**
 * Uploads directly from the browser (not a server action) so the request
 * carries the user's real session cookies — the avatars bucket's team
 * policies check get_auth_profile_id() against teams.created_by, which
 * needs an authenticated request.
 */
export async function uploadTeamAvatar(
  teamId: string,
  file: File,
): Promise<Result<string>> {
  try {
    const supabase = createBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${teamId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) return err(error.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    return ok(data.publicUrl);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteTeamAvatar(teamId: string): Promise<Result<void>> {
  try {
    const supabase = createBrowserClient();

    const { data, error: listError } = await supabase.storage
      .from("avatars")
      .list(teamId);
    if (listError) return err(listError.message);
    if (!data || data.length === 0) return ok(undefined);

    const paths = data.map((file) => `${teamId}/${file.name}`);
    const { error } = await supabase.storage.from("avatars").remove(paths);
    if (error) return err(error.message);

    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
