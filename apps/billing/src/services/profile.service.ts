import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { cache } from "react";

export type MyProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string | null;
};

/** The signed-in user's profile. Cached per request so layouts and pages can
 * both ask for it. */
export const getMyProfile = cache(async (): Promise<Result<MyProfile>> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return err("Not signed in.");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username")
    .eq("auth_user_id", claims.sub)
    .single();
  if (error) return err(error.message);

  return ok({
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    email: typeof claims.email === "string" ? claims.email : null,
  });
});

export async function updateMyName(
  firstName: string,
  lastName: string,
): Promise<Result<void>> {
  const profile = await getMyProfile();
  if (!profile.ok) return profile;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", profile.data.id);
  if (error) return err(error.message);
  return ok(undefined);
}
