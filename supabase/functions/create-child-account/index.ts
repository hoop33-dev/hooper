// Deploy: supabase functions deploy create-child-account
//
// Requires a valid JWT (parent must be authenticated). Uses the service-role
// client to create a child account with email_confirm: true so the child
// never needs email verification (fake email, subdomain we control).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Resolve caller from JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { ok: false, error: "Unauthorized" });
  }
  const callerToken = authHeader.slice(7);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller JWT and get their user id
  const {
    data: { user: callerUser },
    error: userError,
  } = await admin.auth.getUser(callerToken);

  if (userError || !callerUser) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const {
    firstName,
    lastName,
    username,
    password,
    dateOfBirth,
    regionSlug,
    mobile,
  } = body as {
    firstName?: unknown;
    lastName?: unknown;
    username?: unknown;
    password?: unknown;
    dateOfBirth?: unknown;
    regionSlug?: unknown;
    mobile?: unknown;
  };

  if (
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastName !== "string" ||
    !lastName.trim() ||
    typeof username !== "string" ||
    !username.trim() ||
    typeof password !== "string" ||
    !password ||
    typeof dateOfBirth !== "string" ||
    !dateOfBirth.trim()
  ) {
    return json(400, { ok: false, error: "Missing required fields" });
  }

  // Validate password
  if (!PASSWORD_RULE.test(password)) {
    return json(400, {
      ok: false,
      field: "password",
      error:
        "Password must be ≥8 chars with an uppercase letter and a number",
    });
  }

  // Look up caller's profile and confirm they are a parent
  const { data: callerProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, region_id")
    .eq("auth_user_id", callerUser.id)
    .single();

  if (profileError || !callerProfile) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const { data: roleRow, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("profile_id", callerProfile.id)
    .eq("role", "parent")
    .maybeSingle();

  if (roleError || !roleRow) {
    return json(403, { ok: false, error: "Only parents can add children" });
  }

  // Check username availability
  const { data: usernameAvailable, error: usernameError } = await admin.rpc(
    "is_username_available",
    { p_username: username.trim().toLowerCase() },
  );

  if (usernameError) {
    return json(500, { ok: false, error: "Unable to create child account" });
  }

  if (!usernameAvailable) {
    return json(409, {
      ok: false,
      field: "username",
      error: "Username taken",
    });
  }

  // Resolve region slug
  let resolvedRegionSlug: string;
  if (typeof regionSlug === "string" && regionSlug.trim()) {
    resolvedRegionSlug = regionSlug.trim();
  } else {
    // Inherit parent's region
    const { data: regionRow, error: regionErr } = await admin
      .from("regions")
      .select("slug")
      .eq("id", callerProfile.region_id)
      .single();

    if (regionErr || !regionRow) {
      return json(500, { ok: false, error: "Unable to resolve region" });
    }
    resolvedRegionSlug = regionRow.slug;
  }

  // Build fake email
  const fakeEmail = `${username.trim().toLowerCase()}@children.hoop33.co.nz`;

  // Create user via admin API
  const { data: newUserData, error: createError } =
    await admin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim().toLowerCase(),
        mobile: typeof mobile === "string" ? mobile.trim() : null,
        region_slug: resolvedRegionSlug,
        role: "player",
        has_real_email: false,
        date_of_birth:
          typeof dateOfBirth === "string" && dateOfBirth ? dateOfBirth : null,
      },
    });

  if (createError || !newUserData.user) {
    return json(500, { ok: false, error: "Unable to create child account" });
  }

  const newAuthUserId = newUserData.user.id;

  // Read back the new profile id (trigger fires synchronously)
  const { data: newProfile, error: newProfileError } = await admin
    .from("profiles")
    .select("id, first_name, last_name, username")
    .eq("auth_user_id", newAuthUserId)
    .single();

  if (newProfileError || !newProfile) {
    await admin.auth.admin.deleteUser(newAuthUserId);
    return json(500, { ok: false, error: "Unable to create child account" });
  }

  // Insert parent-player link
  const { error: linkError } = await admin
    .from("parent_player_links")
    .insert({
      parent_profile_id: callerProfile.id,
      player_profile_id: newProfile.id,
    });

  if (linkError) {
    await admin.auth.admin.deleteUser(newAuthUserId);
    return json(500, { ok: false, error: "Unable to create child account" });
  }

  return json(200, {
    ok: true,
    child: {
      id: newProfile.id,
      firstName: newProfile.first_name,
      lastName: newProfile.last_name,
      username: newProfile.username,
    },
  });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
