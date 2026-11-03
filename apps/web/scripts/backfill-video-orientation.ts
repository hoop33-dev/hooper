/**
 * One-off backfill: computes `video_orientation` for every existing
 * "link"-sourced exercise that predates the column (see migration
 * 20260825000000_exercise_video_orientation.sql), so athletes see correctly
 * rotated video immediately rather than waiting on a coach to re-save each
 * exercise's video field.
 *
 * Uploaded videos are left untouched — the mobile player reads their
 * orientation live from the decoded video, so they never need this column.
 *
 * Run once, after the migration has been applied (the npm script loads
 * apps/web/.env automatically via node's --env-file):
 *   npm run backfill:video-orientation --workspace=@hooper/web
 *
 * Uses the anon key (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * rather than the service role key, so it's bound by the same RLS policies
 * as the app: exercises.select/update both require an authenticated
 * session, and update is restricted to rows the signed-in account created
 * (see exercises_update_own in 20260630000000_exercise_library.sql). Signs
 * in with SEED_EMAIL/SEED_PASSWORD — a run only backfills exercises owned
 * by that account; other coaches' exercises will fall back to landscape on
 * mobile until re-saved.
 */
import type { Database, ExerciseRow } from "@hooper/db";
import { createClient } from "@supabase/supabase-js";

import { computeVideoOrientation } from "../src/lib/videoOrientation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SEED_EMAIL = process.env.SEED_EMAIL;
const SEED_PASSWORD = process.env.SEED_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SEED_EMAIL || !SEED_PASSWORD) {
  console.error(
    "backfill-video-orientation: missing NEXT_PUBLIC_SUPABASE_URL, " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY, SEED_EMAIL, and/or SEED_PASSWORD in the " +
      "environment. Set them in apps/web/.env and try again.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Sequential with a small delay between requests — this is a maintenance
 * script run rarely, not a hot path, so there's no reason to hammer
 * YouTube's oEmbed endpoint with concurrent requests. */
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: SEED_EMAIL!,
    password: SEED_PASSWORD!,
  });
  if (signInError) {
    console.error("Failed to sign in:", signInError.message);
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, video_url, video_source")
    .eq("video_source", "link")
    .is("video_orientation", null);

  if (error) {
    console.error("Failed to fetch exercises:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Pick<
    ExerciseRow,
    "id" | "name" | "video_url" | "video_source"
  >[];

  console.log(`Found ${rows.length} link-sourced exercise(s) to backfill.`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.video_url) {
      skipped++;
      continue;
    }

    const orientation = await computeVideoOrientation(
      row.video_url,
      row.video_source,
    );

    if (!orientation) {
      console.warn(
        `  skip  "${row.name}" (${row.id}) — could not determine orientation`,
      );
      skipped++;
      await sleep(200);
      continue;
    }

    const { error: updateError } = await supabase
      .from("exercises")
      .update({ video_orientation: orientation })
      .eq("id", row.id);

    if (updateError) {
      console.warn(
        `  skip  "${row.name}" (${row.id}) — update failed: ${updateError.message}`,
      );
      skipped++;
    } else {
      console.log(`  ok    "${row.name}" (${row.id}) -> ${orientation}`);
      updated++;
    }

    await sleep(200);
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

main();
