import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { AthleteMatch } from "@hooper/db";

/** Exact-username lookup via the lookup_athlete_by_username RPC — the only
 * way a coach can find an athlete to add to a team or assign a program to
 * directly, since profiles RLS only allows reading your own row otherwise.
 * Returns null (not an error) when no player has that username. */
export async function lookupAthleteByUsername(
  username: string,
): Promise<Result<AthleteMatch | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("lookup_athlete_by_username", {
      p_username: username,
    });
    if (error) return err(error.message);
    return ok(data?.[0] ?? null);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
