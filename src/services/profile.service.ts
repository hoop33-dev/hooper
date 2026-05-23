import { supabase } from "@/src/lib/supabase";

export type ProfileUpdate = {
  first_name: string;
  last_name: string;
  username: string;
  region_id: string | null;
  bio: string | null;
  is_private: boolean;
  show_age: boolean;
  avatar_url?: string | null;
};

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; field?: "username"; error: string };

export async function updateProfile(
  profileId: string,
  data: ProfileUpdate,
): Promise<UpdateProfileResult> {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", profileId);

  if (error) {
    if (error.code === "23505" && error.message.includes("username")) {
      return { ok: false, field: "username", error: "That username is already taken." };
    }
    return { ok: false, error: "Failed to save profile. Please try again." };
  }

  return { ok: true };
}

export async function uploadAvatar(
  profileId: string,
  uri: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${profileId}/${Date.now()}.${ext}`;

  const arrayBuffer = await fetch(uri).then((r) => r.arrayBuffer());

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error("Failed to upload photo. Please try again.");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
