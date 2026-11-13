// Deploy: supabase functions deploy signin-with-username --no-verify-jwt
//
// Resolves a username to its stored email via the admin API (never
// returned to the caller), verifies password via signInWithPassword, and
// for the "email not confirmed" case tells the client to go to the
// verify-email screen WITHOUT issuing a session — an unverified user must
// not hold one, and verifyOtp needs no session.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: { username?: unknown; password?: unknown; coach_only?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const { username, password, coach_only } = body;
  const isCoachOnly = coach_only === true;

  if (typeof username !== "string" || !username.trim()) {
    return json(400, { ok: false, error: "username is required" });
  }
  if (typeof password !== "string" || !password) {
    return json(400, { ok: false, error: "password is required" });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Throttle: keyed per-username (targeted brute-force) and per-IP (spray).
  // Counted up-front so failures accumulate; cleared on a successful sign-in.
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userKey = `signin:user:${username.trim().toLowerCase()}`;
  const ipKey = `signin:ip:${clientIp}`;

  const [userAttempt, ipAttempt] = await Promise.all([
    admin.rpc("register_signin_attempt", {
      p_key: userKey,
      p_max: 10,
      p_window_seconds: 900,
    }),
    admin.rpc("register_signin_attempt", {
      p_key: ipKey,
      p_max: 30,
      p_window_seconds: 900,
    }),
  ]);

  // Fail open if the throttle infra errors — never lock everyone out.
  if (userAttempt.data === false || ipAttempt.data === false) {
    return json(200, {
      ok: false,
      error:
        "Too many sign-in attempts. Please wait a few minutes and try again.",
    });
  }

  const clearThrottle = () =>
    Promise.all([
      admin.rpc("clear_signin_throttle", { p_key: userKey }),
      admin.rpc("clear_signin_throttle", { p_key: ipKey }),
    ]);

  // Step 1: resolve username → profile (service role bypasses RLS)
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, auth_user_id, has_real_email")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (profileError || !profile) {
    return json(200, { ok: false, error: "Invalid username or password" });
  }

  // Step 2: get the auth user record to retrieve email (admin only — never
  // returned to the caller for unauthenticated requests)
  const { data: authUserData, error: authUserError } =
    await admin.auth.admin.getUserById(profile.auth_user_id);

  if (authUserError || !authUserData?.user?.email) {
    return json(200, { ok: false, error: "Invalid username or password" });
  }

  const authUser = authUserData.user;

  // Step 3: verify credentials
  const { data: signInData, error: signInError } =
    await admin.auth.signInWithPassword({
      email: authUser.email!,
      password,
    });

  if (signInError) {
    // GoTrue verifies the password BEFORE checking email confirmation.
    // "Email not confirmed" therefore means the password was correct.
    const isEmailNotConfirmed =
      signInError.message?.toLowerCase().includes("email not confirmed") ||
      (signInError as any).code === "email_not_confirmed";

    if (isEmailNotConfirmed && profile.has_real_email) {
      // Password was valid but the email is unconfirmed. Issue no session —
      // the client completes verifyOtp (which needs none) on the verify-email
      // screen, and an unverified user must never hold a session.
      await clearThrottle();
      return json(200, {
        ok: true,
        session: null,
        requires_verification: true,
        email_for_otp: authUser.email,
      });
    }

    return json(200, { ok: false, error: "Invalid username or password" });
  }

  if (!signInData?.session) {
    return json(200, { ok: false, error: "Invalid username or password" });
  }

  // Step 4: enforce coach-only restriction after password is verified, so
  // attackers can't enumerate coach accounts without knowing the password.
  if (isCoachOnly) {
    const { data: coachRole, error: coachRoleError } = await admin
      .from("user_roles")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("role", "coach")
      .maybeSingle();

    if (coachRoleError) {
      console.error("coach role lookup failed", coachRoleError);
    }

    if (!coachRole) {
      await admin.auth.admin.signOut(signInData.session.user.id);
      await clearThrottle();
      return json(200, {
        ok: false,
        error: "This sign-in is for coaches only.",
      });
    }
  }

  await clearThrottle();

  const isVerified =
    !profile.has_real_email || authUser.email_confirmed_at != null;

  return json(200, {
    ok: true,
    session: signInData.session,
    requires_verification: profile.has_real_email && !isVerified,
    email_for_otp:
      profile.has_real_email && !isVerified ? authUser.email : null,
  });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
