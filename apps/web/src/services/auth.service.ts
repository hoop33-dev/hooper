import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

export type CoachProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

/** Sign in with username + password via the edge function (coach-only). */
export async function signInWithUsername(
  username: string,
  password: string,
): Promise<Result<void>> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signin-with-username`;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let data: {
    ok: boolean;
    error?: string;
    session?: { access_token: string; refresh_token: string } | null;
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ username, password, coach_only: true }),
    });
    data = await res.json();
  } catch {
    return err("Unable to reach the server. Please try again.");
  }

  if (!data.ok || !data.session) {
    return err(data.error ?? "Sign-in failed.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (error) return err(error.message);

  return ok(undefined);
}

/** Sign the current user out. */
export async function signOut(): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return err(error.message);
  return ok(undefined);
}

/**
 * The signed-in user's auth id (`sub` claim), verified from the JWT.
 *
 * `getClaims()` verifies locally against the project JWKS when asymmetric
 * signing keys are enabled (no network call); middleware has already refreshed
 * the session cookie, so the token here is current. Falls back to a server
 * round-trip only if the project still signs with a shared secret.
 */
async function getAuthUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

/**
 * Fetch the current user's profile and confirm they have the coach role.
 *
 * `cache()`d so the `(portal)` layout's auth gate and each page's own call
 * share one execution per render.
 */
export const getCoachProfile = cache(
  async (): Promise<Result<CoachProfile>> => {
    const supabase = await createClient();

    const authUserId = await getAuthUserId(supabase);
    if (!authUserId) return err("Not authenticated.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username, avatar_url")
      .eq("auth_user_id", authUserId)
      .single();

    if (profileError || !profile) return err("Profile not found.");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", profile.id as string);

    const isCoach = (roles ?? []).some(
      (r: { role: string }) => r.role === "coach",
    );
    if (!isCoach) return err("Not a coach.");

    return ok({
      id: profile.id as string,
      first_name: (profile.first_name as string | null) ?? null,
      last_name: (profile.last_name as string | null) ?? null,
      username: (profile.username as string | null) ?? null,
      avatar_url: (profile.avatar_url as string | null) ?? null,
    });
  },
);

/**
 * Just the current coach's profile id — for pages that only need it to stamp
 * `created_by` on a server action. Skips the `user_roles` round-trip; the
 * coach-role gate in `(portal)/layout.tsx` (via `getCoachProfile`) wraps every
 * portal route, so authorization has already happened by the time a page runs.
 */
export const getCoachProfileId = cache(async (): Promise<Result<string>> => {
  const supabase = await createClient();

  const authUserId = await getAuthUserId(supabase);
  if (!authUserId) return err("Not authenticated.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !profile) return err("Profile not found.");
  return ok(profile.id as string);
});
