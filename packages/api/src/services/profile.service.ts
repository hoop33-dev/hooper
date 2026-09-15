import { getClient } from "../client";

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
  const { error } = await getClient()
    .from("profiles")
    .update(data)
    .eq("id", profileId);

  if (error) {
    if (error.code === "23505" && error.message.includes("username")) {
      return {
        ok: false,
        field: "username",
        error: "That username is already taken.",
      };
    }
    return { ok: false, error: "Failed to save profile. Please try again." };
  }

  return { ok: true };
}

/**
 * Decode a base64 string into raw bytes.
 *
 * We avoid `fetch(uri).arrayBuffer()` because reading a local file:// URI via
 * fetch is unreliable on Android (it throws "Network request failed"). Instead
 * we ask expo-image-picker for base64 directly and decode it here, which works
 * the same across platforms and needs no extra native modules or polyfills.
 */
function decodeBase64(base64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // Strip an optional data-URL prefix (e.g. "data:image/jpeg;base64,").
  const clean = base64.includes(",")
    ? base64.slice(base64.indexOf(",") + 1)
    : base64;

  let length = clean.length * 0.75;
  if (clean[clean.length - 1] === "=") {
    length--;
    if (clean[clean.length - 2] === "=") length--;
  }

  const bytes = new Uint8Array(length);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (clean[i + 2] !== "=") bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (clean[i + 3] !== "=") bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

export async function uploadAvatar(
  profileId: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${profileId}/${Date.now()}.${ext}`;

  const bytes = decodeBase64(base64);

  const { error } = await getClient()
    .storage.from("avatars")
    .upload(path, bytes, { contentType: mimeType, upsert: true });

  if (error) throw new Error("Failed to upload photo. Please try again.");

  const { data } = getClient().storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
