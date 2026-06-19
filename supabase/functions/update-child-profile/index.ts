// Deploy: supabase functions deploy update-child-profile
//
// Requires a valid JWT (parent must be authenticated). Uses the service-role
// client to update a child's profile and guardian controls. A parent may only
// edit a child they are actively linked to. Mirrors create-child-account.
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
    data: { user: callerUser },
    error: userError,
  } = await admin.auth.getUser(callerToken);

  if (userError || !callerUser) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const {
    childProfileId,
    firstName,
    lastName,
    username,
    dateOfBirth,
    regionId,
    profileSettingsLocked,
    avatarUrl,
  } = body as {
    childProfileId?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    username?: unknown;
    dateOfBirth?: unknown;
    regionId?: unknown;
    profileSettingsLocked?: unknown;
    avatarUrl?: unknown;
  };

  if (
    typeof childProfileId !== "string" ||
    !childProfileId.trim() ||
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastName !== "string" ||
    !lastName.trim() ||
    typeof username !== "string" ||
    !username.trim()
  ) {
    return json(400, { ok: false, error: "Missing required fields" });
  }

  // Resolve caller's profile.
  const { data: callerProfile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", callerUser.id)
    .single();

  if (profileError || !callerProfile) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  // Confirm the caller is the active guardian of this child.
  const { data: link, error: linkError } = await admin
    .from("parent_player_links")
    .select("id")
    .eq("parent_profile_id", callerProfile.id)
    .eq("player_profile_id", childProfileId)
    .eq("status", "active")
    .maybeSingle();

  if (linkError || !link) {
    return json(403, {
      ok: false,
      error: "You don't manage this child's account",
    });
  }

  const normalisedUsername = username.trim().toLowerCase();

  // If the username changed, make sure it's free.
  const { data: existing } = await admin
    .from("profiles")
    .select("username")
    .eq("id", childProfileId)
    .single();

  if (existing && existing.username !== normalisedUsername) {
    const { data: available, error: availErr } = await admin.rpc(
      "is_username_available",
      { p_username: normalisedUsername },
    );
    if (availErr) {
      return json(500, { ok: false, error: "Unable to update child profile" });
    }
    if (!available) {
      return json(409, {
        ok: false,
        field: "username",
        error: "Username taken",
      });
    }
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: normalisedUsername,
      date_of_birth:
        typeof dateOfBirth === "string" && dateOfBirth ? dateOfBirth : null,
      region_id: typeof regionId === "string" && regionId ? regionId : null,
      ...(typeof avatarUrl === "string" && avatarUrl
        ? { avatar_url: avatarUrl }
        : {}),
    })
    .eq("id", childProfileId);

  if (updateError) {
    if (updateError.code === "23505") {
      return json(409, {
        ok: false,
        field: "username",
        error: "Username taken",
      });
    }
    return json(500, { ok: false, error: "Unable to update child profile" });
  }

  // Update guardian controls on the link.
  if (typeof profileSettingsLocked === "boolean") {
    const { error: lockError } = await admin
      .from("parent_player_links")
      .update({ profile_settings_locked: profileSettingsLocked })
      .eq("id", link.id);

    if (lockError) {
      return json(500, {
        ok: false,
        error: "Unable to update guardian controls",
      });
    }
  }

  return json(200, { ok: true });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
