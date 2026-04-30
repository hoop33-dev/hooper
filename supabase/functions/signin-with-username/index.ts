// Deploy: supabase functions deploy signin-with-username --no-verify-jwt
//
// This function resolves a username to its stored email (kept server-side),
// then signs in using the service-role client so the email is never returned
// to unauthenticated callers. email_for_otp is only included when the caller
// has already proven their password — exposing their own email at that point
// is acceptable (they own the account).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const { username, password } = body;

  if (typeof username !== "string" || !username.trim()) {
    return json(400, { ok: false, error: "username is required" });
  }
  if (typeof password !== "string" || !password) {
    return json(400, { ok: false, error: "password is required" });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await admin
    .from("profile_with_verification")
    .select("auth_email, is_verified, has_real_email")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (profileError || !profile) {
    return json(200, { ok: false, error: "Invalid username or password" });
  }

  const { data, error: signInError } = await admin.auth.signInWithPassword({
    email: profile.auth_email,
    password,
  });

  if (signInError || !data.session) {
    return json(200, { ok: false, error: "Invalid username or password" });
  }

  const requiresVerification =
    profile.has_real_email === true && profile.is_verified === false;

  return json(200, {
    ok: true,
    session: data.session,
    requires_verification: requiresVerification,
    email_for_otp: requiresVerification ? profile.auth_email : null,
  });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
