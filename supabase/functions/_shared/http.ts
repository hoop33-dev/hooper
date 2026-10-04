// Shared request plumbing for the billing edge functions: CORS, JSON
// responses and resolving the calling user's profile from their JWT.
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Caller = {
  profileId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

/** Verifies the bearer JWT and loads the caller's profile. Returns null when
 * the token is missing/invalid or has no profile. */
export async function resolveCaller(
  req: Request,
  admin: SupabaseClient,
): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    profileId: profile.id,
    email: user.email ?? null,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}
