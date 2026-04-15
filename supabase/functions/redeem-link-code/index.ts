import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      console.error("auth.getUser failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const code = body?.code;
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Attempting to claim code:", code, "for user:", user.id);

    // Atomically claim the code: UPDATE ... WHERE used = false AND expires_at > now()
    const { data: linkCode, error: claimError } = await supabase
      .from("link_codes")
      .update({ used: true })
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .select("id, profile_id")
      .single();

    if (claimError || !linkCode) {
      console.error("claim failed:", claimError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "Claimed code. guardian:",
      linkCode.profile_id,
      "player:",
      user.id,
    );

    // Prevent self-linking
    if (linkCode.profile_id === user.id) {
      await supabase
        .from("link_codes")
        .update({ used: false })
        .eq("id", linkCode.id);
      return new Response(
        JSON.stringify({ error: "Cannot redeem your own code" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create the guardian link
    const { error: linkError } = await supabase.from("profile_links").insert({
      guardian_profile_id: linkCode.profile_id,
      player_profile_id: user.id,
    });
    if (linkError) {
      console.error("profile_links insert failed:", linkError.message);
      await supabase
        .from("link_codes")
        .update({ used: false })
        .eq("id", linkCode.id);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unlock the child profile
    const { error: unlockError } = await supabase
      .from("profiles")
      .update({ is_locked: false })
      .eq("id", user.id);

    if (unlockError) {
      console.error("profiles unlock failed:", unlockError.message);
      return new Response(JSON.stringify({ error: unlockError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Successfully redeemed code for user:", user.id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
