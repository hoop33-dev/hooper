import type { ExerciseWithDetails } from "@hooper/db";
import { describe, expect, it } from "vitest";
import { variantOptionsFor } from "./variantOptions";

function makeExercise(
  overrides: Partial<ExerciseWithDetails> & { id: string; name: string },
): ExerciseWithDetails {
  return {
    description: null,
    video_url: null,
    video_source: null,
    parent_id: null,
    default_style_id: null,
    created_by: "coach1",
    created_at: "",
    updated_at: "",
    categories: [],
    unitTypes: ["Reps"],
    defaultStyle: null,
    variants: [],
    ...overrides,
  };
}

describe("variantOptionsFor", () => {
  it("re-resolves the base from allExercises even when the placement's own embedded exercise IS the base", () => {
    // The placement's own embed (programShaping.ts) always has variants: []
    // — a stale copy of the real base row, which does have variants
    // populated (via listExercises's withVariants pass).
    const staleEmbeddedBase = makeExercise({
      id: "ex-base",
      name: "Ab Wheel Rollout",
      variants: [], // stale, as embedded on a BlockExerciseWithDetails
    });
    const abRoller = makeExercise({
      id: "ex-variant",
      name: "Ab Roller",
      parent_id: "ex-base",
    });
    const freshBase = makeExercise({
      id: "ex-base",
      name: "Ab Wheel Rollout",
      variants: [abRoller], // fresh, as loaded via listExercises
    });
    const allExercises = [freshBase, abRoller];

    expect(variantOptionsFor(staleEmbeddedBase, allExercises)).toEqual([
      freshBase,
      abRoller,
    ]);
  });

  it("resolves siblings when the placement's own exercise is already a variant", () => {
    const abRoller = makeExercise({
      id: "ex-variant",
      name: "Ab Roller",
      parent_id: "ex-base",
    });
    const freshBase = makeExercise({
      id: "ex-base",
      name: "Ab Wheel Rollout",
      variants: [abRoller],
    });
    const allExercises = [freshBase, abRoller];

    expect(variantOptionsFor(abRoller, allExercises)).toEqual([
      freshBase,
      abRoller,
    ]);
  });

  it("falls back to a single-entry list when the exercise isn't found in allExercises", () => {
    const orphan = makeExercise({ id: "ex-orphan", name: "Orphan Exercise" });
    expect(variantOptionsFor(orphan, [])).toEqual([orphan]);
  });

  it("returns a single-entry list for a base exercise with no variants", () => {
    const solo = makeExercise({ id: "ex-solo", name: "Solo Exercise" });
    expect(variantOptionsFor(solo, [solo])).toEqual([solo]);
  });
});
