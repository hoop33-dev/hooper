// Deploy: supabase functions deploy set-child-password
//
// Authenticated. Lets a guardian set a new app password for a child they
// actively manage (parent_player_links). Children have a fake email and no
// inbox, so they can't use the normal reset-by-email flow — this is it.
// Only applies to child accounts (has_real_email = false).
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";

// Mirrors PASSWORD_RULE in packages/shared/src/passwordRules.ts.
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let body: { childProfileId?: unknown; password?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }
    const { childProfileId, password } = body;
    if (typeof childProfileId !== "string" || typeof password !== "string") {
      return json(400, { ok: false, error: "Missing required fields" });
    }
    if (!PASSWORD_RULE.test(password)) {
      return json(400, {
        ok: false,
        field: "password",
        error:
          "Min 8 characters with an uppercase letter, a number, and a special character",
      });
    }

    const { data: link, error: linkError } = await admin
      .from("parent_player_links")
      .select("id")
      .eq("parent_profile_id", caller.profileId)
      .eq("player_profile_id", childProfileId)
      .eq("status", "active")
      .maybeSingle();
    if (linkError) throw new Error(linkError.message);
    if (!link) {
      return json(403, {
        ok: false,
        error: "You don't manage this child's account",
      });
    }

    const { data: child, error: childError } = await admin
      .from("profiles")
      .select("auth_user_id, has_real_email")
      .eq("id", childProfileId)
      .single();
    if (childError) throw new Error(childError.message);
    if (child.has_real_email) {
      return json(403, {
        ok: false,
        error: "This account manages its own password.",
      });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      child.auth_user_id,
      { password },
    );
    if (updateError) throw new Error(updateError.message);

    return json(200, { ok: true });
  } catch (err) {
    console.error("set-child-password: unhandled error", err);
    return json(500, { ok: false, error: "Unable to update the password." });
  }
});
