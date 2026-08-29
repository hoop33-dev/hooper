#!/usr/bin/env node
// Resolves each exercise's YouTube search query to a real top-result video
// ID via yt-dlp, and writes scripts/exercise-video-ids.json. Run this once
// (or whenever EXERCISES changes) before scripts/seed-exercises.mjs so
// exercises get a direct video link instead of a search-results page.
//
// Requires yt-dlp: `pip3 install --user yt-dlp`
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXERCISES, youtubeSearchQuery } from "./seed-exercises.mjs";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outPath = path.join(rootDir, "scripts", "exercise-video-ids.json");

function resolveVideoId(query) {
  const output = execFileSync(
    "python3",
    [
      "-m",
      "yt_dlp",
      `ytsearch1:${query}`,
      "--flat-playlist",
      "--get-id",
      "--skip-download",
      "--no-warnings",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const id = output.trim().split("\n").at(-1);
  if (!id) throw new Error("no id in output");
  return id;
}

async function main() {
  const results = {};
  const failed = [];

  for (const [i, [category, name]] of EXERCISES.entries()) {
    const query = youtubeSearchQuery(name, category);
    try {
      const id = resolveVideoId(query);
      results[name] = id;
      console.log(`[${i + 1}/${EXERCISES.length}] ${name} -> ${id}`);
    } catch (err) {
      failed.push(name);
      console.warn(`[${i + 1}/${EXERCISES.length}] ${name} -> FAILED (${err.message})`);
    }
  }

  writeFileSync(outPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(results).length} video IDs to ${outPath}`);
  if (failed.length > 0) {
    console.log(
      `${failed.length} exercises could not be resolved and will fall back to a search link:`,
    );
    for (const name of failed) console.log(`  - ${name}`);
  }
}

main();
