#!/usr/bin/env node
// Deletes every exercise and exercise category created by SEED_EMAIL, so
// scripts/seed-exercises.mjs can be re-run cleanly (e.g. after switching
// video links from search-results pages to real video IDs).
//
// Scoped to rows owned by the signed-in account (same RLS the app uses) —
// this will NOT touch exercises/categories created by other coaches.
// exercise_category_links / exercise_unit_types cascade automatically.
// Note: exercises are also referenced by block_exercises /
// block_template_exercises with ON DELETE CASCADE, so if any of these
// exercises were already added to a program, that program's blocks will
// lose those entries too.
//
// Usage:
//   SEED_EMAIL=coach@example.com SEED_PASSWORD=... node scripts/reset-exercises.mjs
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

try {
  process.loadEnvFile(path.join(rootDir, ".env.local"));
} catch {
  // .env.local not present — fall back to whatever is already in the
  // environment (e.g. CI secrets).
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (expected in .env.local)",
    );
  }
  if (!email || !password) {
    throw new Error("Missing SEED_EMAIL / SEED_PASSWORD (same account used to seed).");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error(`Sign-in failed: ${authError.message}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authData.user.id)
    .single();
  if (profileError) throw new Error(`Could not load profile: ${profileError.message}`);

  const createdBy = profile.id;
  console.log(`Authenticated as profile ${createdBy}`);

  const { data: exercises, error: exSelectErr } = await supabase
    .from("exercises")
    .select("id")
    .eq("created_by", createdBy);
  if (exSelectErr) throw new Error(exSelectErr.message);

  const { data: categories, error: catSelectErr } = await supabase
    .from("exercise_categories")
    .select("id")
    .eq("created_by", createdBy);
  if (catSelectErr) throw new Error(catSelectErr.message);

  console.log(
    `Found ${exercises?.length ?? 0} exercises and ${categories?.length ?? 0} categories owned by this account.`,
  );

  if ((exercises?.length ?? 0) > 0) {
    const { error } = await supabase.from("exercises").delete().eq("created_by", createdBy);
    if (error) throw new Error(`Delete exercises: ${error.message}`);
    console.log(`Deleted ${exercises.length} exercises (category links / unit types cascaded).`);
  }

  if ((categories?.length ?? 0) > 0) {
    const { error } = await supabase
      .from("exercise_categories")
      .delete()
      .eq("created_by", createdBy);
    if (error) throw new Error(`Delete categories: ${error.message}`);
    console.log(`Deleted ${categories.length} categories.`);
  }

  console.log("\nDone. Re-run `npm run seed:exercises` to reseed.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
