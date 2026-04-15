import { createClient } from "jsr:@supabase/supabase-js@2";

// The Supabase gateway verifies the JWT before invoking this function
// (verify_jwt = true by default), so we can safely decode the payload
// locally without a second network round-trip to the auth service.
function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = getUserIdFromJwt(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { code } = await req.json();
  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
  if (linkCode.profile_id === userId) {
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
    player_profile_id: userId,
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
    .eq("id", userId);

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
