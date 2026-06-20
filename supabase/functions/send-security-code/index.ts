// Deploy: supabase functions deploy send-security-code
//
// Authenticated endpoint: sends a 6-digit OTP to the calling user's email
// so they can verify their identity before changing their password in-app.
// Uses signInWithOtp with shouldCreateUser:false so it only sends to
// existing accounts and can't be used to probe for valid emails.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { ok: false, error: "Unauthorized" });
  }
  const callerToken = authHeader.slice(7);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(callerToken);

  if (userError || !user?.email) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  // Check profile has a real email (child accounts cannot change password via this flow)
  const { data: profile } = await admin
    .from("profiles")
    .select("has_real_email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.has_real_email) {
    return json(403, {
      ok: false,
      error: "Password changes for this account are managed by a guardian.",
    });
  }

  const { error: otpError } = await admin.auth.signInWithOtp({
    email: user.email,
    options: { shouldCreateUser: false },
  });

  if (otpError) {
    const msg = otpError.message?.toLowerCase() ?? "";
    if (msg.includes("429") || msg.includes("rate")) {
      return json(429, {
        ok: false,
        error: "Too many requests. Please wait before trying again.",
      });
    }
    return json(500, { ok: false, error: "Failed to send verification code." });
  }

  const maskedEmail = user.email.replace(
    /(.{2})(.*)(@.*)/,
    (_m: string, a: string, _b: string, c: string) => `${a}···${c}`,
  );

  return json(200, { ok: true, maskedEmail });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
