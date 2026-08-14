import type { BlockExerciseWithDetails, ExerciseStyleRow } from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  abbreviateStyleName,
  resolveDisplayName,
  resolveMostCommonId,
  resolveStylePill,
} from "./blockExerciseDisplay";

describe("resolveMostCommonId", () => {
  it("is the base id, with no non-matching sets, when there are no overrides", () => {
    expect(resolveMostCommonId("base", {}, 4)).toEqual({
      winnerId: "base",
      nonMatchingCount: 0,
    });
  });

  it("picks the id used by the most sets, counting non-overridden sets as the base id", () => {
    // 3 sets base, 1 set "variant-a" — base still wins.
    expect(resolveMostCommonId("base", { 2: "variant-a" }, 4)).toEqual({
      winnerId: "base",
      nonMatchingCount: 1,
    });
  });

  it("picks a variant that outnumbers the base", () => {
    // sets: [a, a, a, base] — "a" wins 3-1.
    expect(resolveMostCommonId("base", { 0: "a", 1: "a", 2: "a" }, 4)).toEqual({
      winnerId: "a",
      nonMatchingCount: 1,
    });
  });

  it("breaks ties by earliest set index", () => {
    // sets: [a, b] — tied 1-1, "a" appeared first (set 0).
    expect(resolveMostCommonId("base", { 0: "a", 1: "b" }, 2)).toEqual({
      winnerId: "a",
      nonMatchingCount: 1,
    });
  });

  it("returns the base id unchanged for zero sets", () => {
    expect(resolveMostCommonId("base", { 0: "a" }, 0)).toEqual({
      winnerId: "base",
      nonMatchingCount: 0,
    });
  });
});

function makeExercise(id: string, name: string) {
  return {
    id,
    name,
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
  };
}

function makeBlockExercise(
  overrides: Partial<BlockExerciseWithDetails> = {},
): BlockExerciseWithDetails {
  const exercise = makeExercise("ex-base", "Around-the-World Shooting");
  return {
    id: "be-1",
    block_id: "block-1",
    exercise_id: "ex-base",
    position: 0,
    sets: 3,
    notes: null,
    link_group_id: null,
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise,
    measurements: [],
    setVariants: {},
    setStyles: {},
    ...overrides,
  };
}

describe("resolveDisplayName", () => {
  it("is the plain exercise name when no set has a variant override", () => {
    expect(resolveDisplayName(makeBlockExercise())).toBe(
      "Around-the-World Shooting",
    );
  });

  it("is the plain exercise name when the base exercise is still the most common", () => {
    const bankShotOnly = makeExercise("ex-bank", "Bank Shot Only");
    const be = makeBlockExercise({
      sets: 4,
      // sets: [base, base, bank-shot-only, ???] — base wins outright with
      // only 1 override present (2 explicit base sets vs 1 override).
      setVariants: { 2: bankShotOnly },
    });
    expect(resolveDisplayName(be)).toBe("Around-the-World Shooting");
  });

  it("shows the winning variant's name with +N when it beats the base", () => {
    const bankShotOnly = makeExercise("ex-bank", "Bank Shot Only");
    const be = makeBlockExercise({
      sets: 4,
      // sets: [bank, bank, bank, base] — variant wins 3-1.
      setVariants: { 0: bankShotOnly, 1: bankShotOnly, 2: bankShotOnly },
    });
    expect(resolveDisplayName(be)).toBe("Bank Shot Only +1");
  });

  it("omits the +N suffix once every set agrees on one variant", () => {
    const fiveSpot = makeExercise("ex-5spot", "5-Spot");
    const be = makeBlockExercise({
      sets: 2,
      setVariants: { 0: fiveSpot, 1: fiveSpot },
    });
    expect(resolveDisplayName(be)).toBe("5-Spot");
  });
});

function makeStyle(id: string, name: string): ExerciseStyleRow {
  return {
    id,
    name,
    description: null,
    position: 0,
    created_by: "coach1",
    created_at: "",
    updated_at: "",
  };
}

describe("abbreviateStyleName", () => {
  it("uses the first letter of each of the first two words", () => {
    expect(abbreviateStyleName("Warm Up")).toBe("WU");
    expect(abbreviateStyleName("Bank Shot Only")).toBe("BS");
  });

  it("uses the first two letters of a single-word name", () => {
    expect(abbreviateStyleName("Warmup")).toBe("WA");
    expect(abbreviateStyleName("Working")).toBe("WO");
  });
});

describe("resolveStylePill", () => {
  const allStyles = [makeStyle("style-warmup", "Warmup")];

  it("is null when no set has any style at all", () => {
    expect(resolveStylePill(makeBlockExercise(), allStyles)).toBeNull();
  });

  it("resolves the placement's own style_id when it wins", () => {
    const be = makeBlockExercise({ style_id: "style-warmup" });
    expect(resolveStylePill(be, allStyles)).toBe("WA");
  });

  it("resolves the winning per-set style override's abbreviation", () => {
    const working = makeStyle("style-working", "Working");
    const be = makeBlockExercise({
      sets: 3,
      setStyles: { 0: working, 1: working },
    });
    expect(resolveStylePill(be, allStyles)).toBe("WO");
  });

  it("treats an explicit null override as 'no style' for that set", () => {
    const be = makeBlockExercise({
      sets: 2,
      style_id: "style-warmup",
      setStyles: { 0: null },
    });
    // set 0 explicitly has no style, set 1 inherits "Warmup" — tied 1-1,
    // earliest (set 0, "no style") wins, so no pill at all.
    expect(resolveStylePill(be, allStyles)).toBeNull();
  });
});
