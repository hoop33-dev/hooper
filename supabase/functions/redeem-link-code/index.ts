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

  // Look up a valid, unused, unexpired code
  const { data: linkCode, error: lookupError } = await supabase
    .from("link_codes")
    .select("id, profile_id")
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (lookupError || !linkCode) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create the guardian link
  const { error: linkError } = await supabase.from("profile_links").insert({
    guardian_profile_id: linkCode.profile_id,
    player_profile_id: user.id,
  });
  if (linkError) {
    return new Response(JSON.stringify({ error: linkError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mark the code used and unlock the child profile
  await Promise.all([
    supabase.from("link_codes").update({ used: true }).eq("id", linkCode.id),
    supabase.from("profiles").update({ is_locked: false }).eq("id", user.id),
  ]);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
