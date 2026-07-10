#!/usr/bin/env node
// Seeds the exercise library with a starter set of upper body, lower body,
// and basketball exercises (with categories and YouTube video links).
//
// This runs as a normal authenticated user (not the service role), so every
// row is subject to RLS exactly like the app itself — `created_by` on
// categories/exercises is the signed-in coach's profile id.
//
// Usage:
//   SEED_EMAIL=coach@example.com SEED_PASSWORD=... node scripts/seed-exercises.mjs
//   DRY_RUN=1 node scripts/seed-exercises.mjs   # validate data, no network/auth needed
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    process.loadEnvFile(path.join(rootDir, ".env.local"));
  } catch {
    // .env.local not present — fall back to whatever is already in the
    // environment (e.g. CI secrets).
  }
}

const DRY_RUN = process.env.DRY_RUN === "1";

// ── Unit type presets ─────────────────────────────────────────
// Values must match apps/web/src/constants/unitTypes.ts (UNIT_TYPES).
const UNIT_KIND = {
  weighted: ["Weight", "Reps"],
  weightedUnilateral: ["Weight", "Reps Each Side"],
  bodyweight: ["Reps"],
  bodyweightUnilateral: ["Reps Each Side"],
  timed: ["Time"],
  shooting: ["Makes", "Shots"],
  distance: ["Distance", "Time"],
  loadedDistance: ["Weight", "Distance"],
};

// ── Categories ─────────────────────────────────────────────────
export const CATEGORY_TREE = [
  {
    name: "Upper Body",
    children: ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core"],
  },
  {
    name: "Lower Body",
    children: ["Quadriceps", "Hamstrings", "Glutes", "Calves", "Plyometrics"],
  },
  {
    name: "Basketball",
    children: [
      "Ball Handling",
      "Shooting",
      "Finishing",
      "Footwork & Agility",
      "Conditioning",
      "Defense",
    ],
  },
];

const BASKETBALL_CATEGORIES = new Set(
  CATEGORY_TREE.find((c) => c.name === "Basketball").children,
);

// ── Exercises ────────────────────────────────────────────────
// [category, name, unitKind]
export const EXERCISES = [
  // Chest
  ["Chest", "Barbell Bench Press", "weighted"],
  ["Chest", "Incline Barbell Bench Press", "weighted"],
  ["Chest", "Decline Barbell Bench Press", "weighted"],
  ["Chest", "Dumbbell Bench Press", "weighted"],
  ["Chest", "Incline Dumbbell Press", "weighted"],
  ["Chest", "Dumbbell Fly", "weighted"],
  ["Chest", "Incline Dumbbell Fly", "weighted"],
  ["Chest", "Cable Crossover", "weighted"],
  ["Chest", "Push-Up", "bodyweight"],
  ["Chest", "Weighted Push-Up", "weighted"],
  ["Chest", "Chest Dip", "bodyweight"],
  ["Chest", "Pec Deck Machine", "weighted"],
  ["Chest", "Landmine Press", "weightedUnilateral"],

  // Back
  ["Back", "Deadlift", "weighted"],
  ["Back", "Chest-Supported Row", "weighted"],
  ["Back", "Pull-Up", "bodyweight"],
  ["Back", "Chin-Up", "bodyweight"],
  ["Back", "Lat Pulldown", "weighted"],
  ["Back", "Barbell Row", "weighted"],
  ["Back", "Pendlay Row", "weighted"],
  ["Back", "Dumbbell Row", "weightedUnilateral"],
  ["Back", "T-Bar Row", "weighted"],
  ["Back", "Seated Cable Row", "weighted"],
  ["Back", "Face Pull", "weighted"],
  ["Back", "Straight-Arm Pulldown", "weighted"],
  ["Back", "Inverted Row", "bodyweight"],

  // Shoulders
  ["Shoulders", "Overhead Barbell Press", "weighted"],
  ["Shoulders", "Seated Dumbbell Shoulder Press", "weighted"],
  ["Shoulders", "Arnold Press", "weighted"],
  ["Shoulders", "Lateral Raise", "weighted"],
  ["Shoulders", "Front Raise", "weighted"],
  ["Shoulders", "Rear Delt Fly", "weighted"],
  ["Shoulders", "Cable Lateral Raise", "weightedUnilateral"],
  ["Shoulders", "Upright Row", "weighted"],
  ["Shoulders", "Barbell Shrug", "weighted"],
  ["Shoulders", "Push Press", "weighted"],
  ["Shoulders", "Landmine Lateral Raise", "weightedUnilateral"],
  ["Shoulders", "Reverse Pec Deck", "weighted"],

  // Biceps
  ["Biceps", "Barbell Curl", "weighted"],
  ["Biceps", "Dumbbell Curl", "weighted"],
  ["Biceps", "Hammer Curl", "weighted"],
  ["Biceps", "Incline Dumbbell Curl", "weighted"],
  ["Biceps", "Preacher Curl", "weighted"],
  ["Biceps", "Concentration Curl", "weightedUnilateral"],
  ["Biceps", "Cable Curl", "weighted"],
  ["Biceps", "EZ-Bar Curl", "weighted"],
  ["Biceps", "Zottman Curl", "weighted"],
  ["Biceps", "Spider Curl", "weighted"],
  ["Biceps", "Reverse Curl", "weighted"],
  ["Biceps", "Drag Curl", "weighted"],

  // Triceps
  ["Triceps", "Close-Grip Bench Press", "weighted"],
  ["Triceps", "Tricep Pushdown", "weighted"],
  ["Triceps", "Overhead Tricep Extension", "weighted"],
  ["Triceps", "Skull Crusher", "weighted"],
  ["Triceps", "Dumbbell Kickback", "weightedUnilateral"],
  ["Triceps", "Tricep Dip", "bodyweight"],
  ["Triceps", "Rope Pushdown", "weighted"],
  ["Triceps", "Diamond Push-Up", "bodyweight"],
  ["Triceps", "Cable Overhead Extension", "weighted"],
  ["Triceps", "JM Press", "weighted"],
  ["Triceps", "Bench Dip", "bodyweight"],
  ["Triceps", "Single-Arm Tricep Extension", "weightedUnilateral"],

  // Core
  ["Core", "Plank", "timed"],
  ["Core", "Side Plank", "timed"],
  ["Core", "Hanging Leg Raise", "bodyweight"],
  ["Core", "Cable Crunch", "weighted"],
  ["Core", "Russian Twist", "bodyweight"],
  ["Core", "Ab Wheel Rollout", "bodyweight"],
  ["Core", "Bicycle Crunch", "bodyweight"],
  ["Core", "V-Up", "bodyweight"],
  ["Core", "Dead Bug", "bodyweight"],
  ["Core", "Mountain Climber", "timed"],
  ["Core", "Cable Woodchopper", "weightedUnilateral"],
  ["Core", "Sit-Up", "bodyweight"],
  ["Core", "Flutter Kick", "timed"],

  // Quadriceps
  ["Quadriceps", "Back Squat", "weighted"],
  ["Quadriceps", "Front Squat", "weighted"],
  ["Quadriceps", "Leg Press", "weighted"],
  ["Quadriceps", "Bulgarian Split Squat", "weightedUnilateral"],
  ["Quadriceps", "Walking Lunge", "weightedUnilateral"],
  ["Quadriceps", "Reverse Lunge", "weightedUnilateral"],
  ["Quadriceps", "Goblet Squat", "weighted"],
  ["Quadriceps", "Leg Extension", "weighted"],
  ["Quadriceps", "Step-Up", "weightedUnilateral"],
  ["Quadriceps", "Hack Squat", "weighted"],
  ["Quadriceps", "Sissy Squat", "bodyweight"],
  ["Quadriceps", "Zercher Squat", "weighted"],
  ["Quadriceps", "Wall Sit", "timed"],

  // Hamstrings
  ["Hamstrings", "Romanian Deadlift", "weighted"],
  ["Hamstrings", "Stiff-Leg Deadlift", "weighted"],
  ["Hamstrings", "Nordic Hamstring Curl", "bodyweight"],
  ["Hamstrings", "Lying Leg Curl", "weighted"],
  ["Hamstrings", "Seated Leg Curl", "weighted"],
  ["Hamstrings", "Good Morning", "weighted"],
  ["Hamstrings", "Single-Leg Romanian Deadlift", "weightedUnilateral"],
  ["Hamstrings", "Glute-Ham Raise", "bodyweight"],
  ["Hamstrings", "Kettlebell Swing", "weighted"],
  ["Hamstrings", "Reverse Hyperextension", "weighted"],
  ["Hamstrings", "Sliding Leg Curl", "bodyweight"],
  ["Hamstrings", "Banded Leg Curl", "bodyweight"],
  ["Hamstrings", "Swiss Ball Leg Curl", "bodyweight"],

  // Glutes
  ["Glutes", "Hip Thrust", "weighted"],
  ["Glutes", "Barbell Glute Bridge", "weighted"],
  ["Glutes", "Cable Kickback", "weightedUnilateral"],
  ["Glutes", "Single-Leg Hip Thrust", "weightedUnilateral"],
  ["Glutes", "Frog Pump", "bodyweight"],
  ["Glutes", "Curtsy Lunge", "weightedUnilateral"],
  ["Glutes", "Clamshell", "bodyweightUnilateral"],
  ["Glutes", "Banded Lateral Walk", "bodyweight"],
  ["Glutes", "Donkey Kick", "bodyweightUnilateral"],
  ["Glutes", "Sumo Deadlift", "weighted"],
  ["Glutes", "Cable Pull-Through", "weighted"],
  ["Glutes", "Fire Hydrant", "bodyweightUnilateral"],

  // Calves
  ["Calves", "Standing Calf Raise", "weighted"],
  ["Calves", "Seated Calf Raise", "weighted"],
  ["Calves", "Donkey Calf Raise", "weighted"],
  ["Calves", "Single-Leg Calf Raise", "weightedUnilateral"],
  ["Calves", "Leg Press Calf Raise", "weighted"],
  ["Calves", "Jump Rope", "timed"],
  ["Calves", "Calf Raise on Step", "bodyweight"],
  ["Calves", "Farmer's Walk on Toes", "loadedDistance"],
  ["Calves", "Tibialis Raise", "bodyweight"],
  ["Calves", "Smith Machine Calf Raise", "weighted"],

  // Plyometrics
  ["Plyometrics", "Box Jump", "bodyweight"],
  ["Plyometrics", "Broad Jump", "distance"],
  ["Plyometrics", "Depth Jump", "bodyweight"],
  ["Plyometrics", "Squat Jump", "bodyweight"],
  ["Plyometrics", "Lateral Bound", "bodyweightUnilateral"],
  ["Plyometrics", "Tuck Jump", "bodyweight"],
  ["Plyometrics", "Single-Leg Box Jump", "bodyweightUnilateral"],
  ["Plyometrics", "Skater Jump", "bodyweightUnilateral"],
  ["Plyometrics", "Split Jump", "bodyweight"],
  ["Plyometrics", "Bounding", "distance"],
  ["Plyometrics", "Pogo Jump", "timed"],
  ["Plyometrics", "Jump Lunge", "bodyweight"],

  // Ball Handling
  ["Ball Handling", "Stationary Dribble Series", "timed"],
  ["Ball Handling", "Crossover Dribble", "bodyweight"],
  ["Ball Handling", "Between-the-Legs Dribble", "bodyweight"],
  ["Ball Handling", "Behind-the-Back Dribble", "bodyweight"],
  ["Ball Handling", "Two-Ball Dribbling", "timed"],
  ["Ball Handling", "Figure-8 Dribble", "timed"],
  ["Ball Handling", "Cone Dribble Series", "timed"],
  ["Ball Handling", "Pound Dribble", "timed"],
  ["Ball Handling", "Combo Move Dribble", "timed"],
  ["Ball Handling", "Spider Dribble", "timed"],
  ["Ball Handling", "Tennis Ball Reaction Drill", "timed"],
  ["Ball Handling", "Chair Dribble Drill", "timed"],
  ["Ball Handling", "Full-Court Speed Dribble", "distance"],

  // Shooting
  ["Shooting", "Form Shooting", "shooting"],
  ["Shooting", "Spot Shooting", "shooting"],
  ["Shooting", "Catch-and-Shoot", "shooting"],
  ["Shooting", "Off-the-Dribble Jump Shot", "shooting"],
  ["Shooting", "Free Throw Practice", "shooting"],
  ["Shooting", "Three-Point Shooting", "shooting"],
  ["Shooting", "Mikan Drill", "shooting"],
  ["Shooting", "Pull-Up Jump Shot", "shooting"],
  ["Shooting", "Step-Back Jump Shot", "shooting"],
  ["Shooting", "Floater / Runner", "shooting"],
  ["Shooting", "Bank Shot Drill", "shooting"],
  ["Shooting", "Elbow Shooting Drill", "shooting"],
  ["Shooting", "Around-the-World Shooting", "shooting"],

  // Finishing
  ["Finishing", "Layup Drill", "shooting"],
  ["Finishing", "Reverse Layup", "shooting"],
  ["Finishing", "Euro Step Layup", "shooting"],
  ["Finishing", "Floater Finish", "shooting"],
  ["Finishing", "Power Layup", "shooting"],
  ["Finishing", "Finger Roll", "shooting"],
  ["Finishing", "Two-Ball Layup Drill", "shooting"],
  ["Finishing", "Contested Layup Drill", "shooting"],
  ["Finishing", "Off-Hand Layup", "shooting"],
  ["Finishing", "Alley-Oop Finish", "bodyweight"],
  ["Finishing", "Post Up-and-Under", "shooting"],
  ["Finishing", "Dunk Practice", "bodyweight"],

  // Footwork & Agility
  ["Footwork & Agility", "Defensive Slide", "timed"],
  ["Footwork & Agility", "Ladder Drill - Icky Shuffle", "timed"],
  ["Footwork & Agility", "Ladder Drill - In-Out", "timed"],
  ["Footwork & Agility", "Cone Zig-Zag Sprint", "timed"],
  ["Footwork & Agility", "Jump Stop", "bodyweight"],
  ["Footwork & Agility", "Pivot Drill", "bodyweight"],
  ["Footwork & Agility", "Triple Threat Footwork", "timed"],
  ["Footwork & Agility", "Reactive Shuffle Drill", "timed"],
  ["Footwork & Agility", "Mirror Drill", "timed"],
  ["Footwork & Agility", "Star Drill", "timed"],
  ["Footwork & Agility", "Close-Out Drill", "timed"],
  ["Footwork & Agility", "Hip Turn Drill", "bodyweight"],
  ["Footwork & Agility", "Backpedal Sprint", "distance"],

  // Conditioning
  ["Conditioning", "Suicide Sprints", "timed"],
  ["Conditioning", "Full-Court Sprint", "timed"],
  ["Conditioning", "Line Drill (17s)", "timed"],
  ["Conditioning", "Shuttle Run", "timed"],
  ["Conditioning", "Defensive Slide Conditioning", "timed"],
  ["Conditioning", "Stair Sprints", "timed"],
  ["Conditioning", "Interval Sprint Training", "timed"],
  ["Conditioning", "Bike Sprints", "timed"],
  ["Conditioning", "Rowing Intervals", "timed"],
  ["Conditioning", "Sled Push", "loadedDistance"],
  ["Conditioning", "Battle Ropes", "timed"],
  ["Conditioning", "Burpee Conditioning", "bodyweight"],

  // Defense
  ["Defense", "Closeout to Contest", "bodyweight"],
  ["Defense", "Defensive Stance Hold", "timed"],
  ["Defense", "On-Ball Defense Drill", "timed"],
  ["Defense", "Help-Side Rotation Drill", "timed"],
  ["Defense", "Box Out Drill", "bodyweight"],
  ["Defense", "Charge Drill", "bodyweight"],
  ["Defense", "Denial Defense Drill", "timed"],
  ["Defense", "Shell Drill", "timed"],
  ["Defense", "Rebounding Drill", "bodyweight"],
  ["Defense", "Steal Drill", "bodyweight"],
  ["Defense", "Post Defense Drill", "timed"],
  ["Defense", "Trap Drill", "timed"],
];

export function youtubeSearchQuery(name, categoryName) {
  const suffix = BASKETBALL_CATEGORIES.has(categoryName)
    ? "basketball drill tutorial"
    : "exercise tutorial";
  return `${name} ${suffix}`;
}

// Resolved by scripts/fetch-exercise-video-ids.mjs into real YouTube video
// IDs (one search each, top result). Falls back to a search-results link for
// any exercise not yet resolved.
const videoIdsPath = path.join(rootDir, "scripts", "exercise-video-ids.json");
const videoIdsByName = existsSync(videoIdsPath)
  ? JSON.parse(readFileSync(videoIdsPath, "utf8"))
  : {};

function videoUrlFor(name, categoryName) {
  const videoId = videoIdsByName[name];
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  const query = youtubeSearchQuery(name, categoryName);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function validateData() {
  const names = new Set();
  for (const [category, name] of EXERCISES) {
    if (names.has(name)) {
      throw new Error(`Duplicate exercise name: ${name}`);
    }
    names.add(name);
    const known = CATEGORY_TREE.some((p) => p.children.includes(category));
    if (!known) {
      throw new Error(`Exercise "${name}" references unknown category "${category}"`);
    }
  }
  for (const [, , kind] of EXERCISES) {
    if (!UNIT_KIND[kind]) {
      throw new Error(`Unknown unit kind: ${kind}`);
    }
  }
  return names.size;
}

async function main() {
  const total = validateData();
  const byCategory = new Map();
  for (const [category] of EXERCISES) {
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
  }

  console.log(`Validated ${total} exercises across ${byCategory.size} categories:`);
  for (const [category, count] of byCategory) {
    console.log(`  ${category}: ${count}`);
  }

  if (DRY_RUN) {
    console.log("\nDRY_RUN=1 set — not connecting to Supabase.");
    return;
  }

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
    throw new Error(
      "Missing SEED_EMAIL / SEED_PASSWORD. Set these to an existing coach account's " +
        "login — the script authenticates as that user so rows are created under " +
        "their profile (same as using the app).",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`\nSigning in as ${email}...`);
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

  // ── Categories ─────────────────────────────────────────────
  const { data: existingCategories, error: existingCatErr } = await supabase
    .from("exercise_categories")
    .select("id, name, parent_id");
  if (existingCatErr) throw new Error(existingCatErr.message);

  const categoryIdByName = new Map(
    (existingCategories ?? []).map((c) => [c.name, c.id]),
  );

  for (const parent of CATEGORY_TREE) {
    if (!categoryIdByName.has(parent.name)) {
      const { data, error } = await supabase
        .from("exercise_categories")
        .insert({ name: parent.name, created_by: createdBy })
        .select("id")
        .single();
      if (error) throw new Error(`Insert category "${parent.name}": ${error.message}`);
      categoryIdByName.set(parent.name, data.id);
      console.log(`Created category: ${parent.name}`);
    }

    const parentId = categoryIdByName.get(parent.name);
    for (const childName of parent.children) {
      if (categoryIdByName.has(childName)) continue;
      const { data, error } = await supabase
        .from("exercise_categories")
        .insert({ name: childName, parent_id: parentId, created_by: createdBy })
        .select("id")
        .single();
      if (error) throw new Error(`Insert category "${childName}": ${error.message}`);
      categoryIdByName.set(childName, data.id);
      console.log(`Created category: ${parent.name} > ${childName}`);
    }
  }

  // ── Exercises ────────────────────────────────────────────────
  const { data: existingExercises, error: existingExErr } = await supabase
    .from("exercises")
    .select("id, name");
  if (existingExErr) throw new Error(existingExErr.message);

  const existingNames = new Set(
    (existingExercises ?? []).map((e) => e.name.toLowerCase()),
  );

  const toInsert = EXERCISES.filter(
    ([, name]) => !existingNames.has(name.toLowerCase()),
  );

  console.log(
    `\n${toInsert.length} new exercises to insert (${EXERCISES.length - toInsert.length} already exist).`,
  );

  let created = 0;
  for (const [category, name, kind] of toInsert) {
    const categoryId = categoryIdByName.get(category);
    const { data: exerciseRow, error: exError } = await supabase
      .from("exercises")
      .insert({
        name,
        video_url: videoUrlFor(name, category),
        video_source: "link",
        created_by: createdBy,
      })
      .select("id")
      .single();
    if (exError) throw new Error(`Insert exercise "${name}": ${exError.message}`);

    const { error: linkError } = await supabase
      .from("exercise_category_links")
      .insert({ exercise_id: exerciseRow.id, category_id: categoryId });
    if (linkError) throw new Error(`Link exercise "${name}": ${linkError.message}`);

    const unitTypes = UNIT_KIND[kind];
    const { error: unitError } = await supabase.from("exercise_unit_types").insert(
      unitTypes.map((unit_type, position) => ({
        exercise_id: exerciseRow.id,
        unit_type,
        position,
      })),
    );
    if (unitError) throw new Error(`Unit types for "${name}": ${unitError.message}`);

    created += 1;
    if (created % 25 === 0) console.log(`  ...${created}/${toInsert.length}`);
  }

  console.log(`\nDone. Created ${created} exercises.`);
}

if (isMain) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
