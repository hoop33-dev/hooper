import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";

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
