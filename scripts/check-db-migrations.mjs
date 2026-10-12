#!/usr/bin/env node
// Deterministic guard for SQL files (Layer 5 of the quality system).
//
// Two rules:
//   1. SQL files may only live in supabase/migrations/ or supabase/tests/.
//      Anything else fails the build.
//   2. Editing an *existing* migration warns — migrations are append-only,
//      and editing one that has already been applied corrupts DB state.
//
// Modes:
//   - Local / pre-commit: diff staged changes against HEAD (git diff --cached).
//   - CI: set BASE_REF (e.g. origin/dev) to diff the PR against its base so
//     edits to already-merged migrations are caught.
import { execSync } from "node:child_process";

const ALLOWED_DIRS = ["supabase/migrations/", "supabase/tests/"];
const baseRef = process.env.BASE_REF; // e.g. "origin/dev" in CI

function git(args) {
  return execSync(`git ${args}`, { encoding: "utf8" }).trim();
}

function diffRange() {
  if (!baseRef) return "--cached"; // staged vs HEAD (local / pre-commit)
  // Compare the PR tip against the merge-base with its target branch.
  try {
    const mergeBase = git(`merge-base ${baseRef} HEAD`);
    return `${mergeBase}...HEAD`;
  } catch {
    return `${baseRef}...HEAD`;
  }
}

let changed;
try {
  changed = git(`diff --name-status ${diffRange()}`);
} catch (err) {
  console.error(
    `check-db-migrations: unable to compute git diff (${err.message}).`,
  );
  process.exit(0); // never fail the build on a git plumbing hiccup
}

const sqlChanges = changed
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const parts = line.split("\t");
    return { status: parts[0][0], file: parts[parts.length - 1] };
  })
  .filter((c) => c.file.endsWith(".sql"));

const errors = [];
const warnings = [];

for (const { status, file } of sqlChanges) {
  if (!ALLOWED_DIRS.some((dir) => file.startsWith(dir))) {
    errors.push(
      `  ✗ ${file}\n    SQL files must live in ${ALLOWED_DIRS.join(" or ")}.`,
    );
    continue;
  }
  // Modified (not added) migration → append-only violation.
  if (status === "M" && file.startsWith("supabase/migrations/")) {
    warnings.push(
      `  ⚠ ${file}\n    Migration edited. Migrations are append-only — editing an applied\n    migration corrupts DB state. Add a new migration instead.`,
    );
  }
}

if (warnings.length) {
  console.warn(
    "\ncheck-db-migrations: warnings\n" + warnings.join("\n") + "\n",
  );
}

if (errors.length) {
  console.error("\ncheck-db-migrations: errors\n" + errors.join("\n") + "\n");
  process.exit(1);
}

console.log("check-db-migrations: ok");
