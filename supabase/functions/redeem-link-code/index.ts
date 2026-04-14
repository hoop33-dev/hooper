import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { code } = await req.json();
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Atomically claim the code: UPDATE ... WHERE used = false AND expires_at > now()
  // RETURNING ensures only one concurrent request can succeed for the same code.
  const { data: linkCode, error: claimError } = await supabase
    .from("link_codes")
    .update({ used: true })
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .select("id, profile_id")
    .single();

  if (claimError || !linkCode) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Prevent self-linking: the redeemer must be a different profile than the code owner
  if (linkCode.profile_id === user.id) {
    // Roll back the claim so the code remains usable by someone else
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
    // Roll back the claim so the code remains usable
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
    return new Response(JSON.stringify({ error: unlockError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
