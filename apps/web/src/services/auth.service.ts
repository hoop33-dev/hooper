import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";

/** Sign in with email + password. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
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
