import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";

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

/** Fetch the current user's profile and confirm they have the coach role. */
export async function getCoachProfile(): Promise<Result<CoachProfile>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Not authenticated.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, avatar_url")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) return err("Profile not found.");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("profile_id", profile.id as string);

  const isCoach = (roles ?? []).some((r: { role: string }) => r.role === "coach");
  if (!isCoach) return err("Not a coach.");

  return ok({
    id: profile.id as string,
    first_name: (profile.first_name as string | null) ?? null,
    last_name: (profile.last_name as string | null) ?? null,
    username: (profile.username as string | null) ?? null,
    avatar_url: (profile.avatar_url as string | null) ?? null,
  });
}
