import {
  groupSetsByVariant,
  resolveGroupStyle,
  resolveMostCommonId,
  resolveSetExercise,
  resolveSetStyle,
} from "@/src/lib/blockExerciseDisplay";
import type { AthleteBlockExercise } from "@hooper/api";
import type { ExerciseRow, ExerciseStyleRow } from "@hooper/db";

describe("resolveMostCommonId", () => {
  it("is the base id, with no non-matching sets, when there are no overrides", () => {
    expect(resolveMostCommonId("base", {}, 4)).toEqual({
      winnerId: "base",
      nonMatchingCount: 0,
    });
  });

  it("breaks ties by earliest set index", () => {
    expect(resolveMostCommonId("base", { 0: "a", 1: "b" }, 2)).toEqual({
      winnerId: "a",
      nonMatchingCount: 1,
    });
  });
});

function makeExercise(id: string, name: string): ExerciseRow {
  return {
    id,
    name,
    description: null,
    video_url: null,
    video_source: null,
    video_orientation: null,
    video_thumbnail_url: null,
    parent_id: null,
    default_style_id: null,
    created_by: "coach1",
    created_at: "",
    updated_at: "",
  };
}

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

const cableRaise = makeExercise("ex-cable-raise", "Cable Raise");

function makeBlockExercise(
  overrides: Partial<AthleteBlockExercise> = {},
): AthleteBlockExercise {
  return {
    id: "be-1",
    block_id: "block-1",
    exercise_id: cableRaise.id,
    position: 0,
    sets: 3,
    notes: null,
    link_group_id: null,
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise: cableRaise,
    measurements: [],
    style: null,
    setVariants: {},
    setStyles: {},
    ...overrides,
  };
}

describe("resolveSetExercise", () => {
  it("is the placement's own exercise when the set has no variant override", () => {
    const be = makeBlockExercise();
    expect(resolveSetExercise(be, 0)).toBe(cableRaise);
  });

  it("is the override exercise for a set with a variant", () => {
    const leaningCableRaise = makeExercise(
      "ex-leaning-cable-raise",
      "Leaning Cable Raise",
    );
    const be = makeBlockExercise({ setVariants: { 2: leaningCableRaise } });
    expect(resolveSetExercise(be, 2)).toBe(leaningCableRaise);
    expect(resolveSetExercise(be, 0)).toBe(cableRaise);
  });
});

describe("groupSetsByVariant", () => {
  it("yields a single group covering every set when there are no overrides", () => {
    const be = makeBlockExercise({ sets: 3 });
    expect(groupSetsByVariant(be)).toEqual([
      { exercise: cableRaise, setIndices: [0, 1, 2] },
    ]);
  });

  it("splits into contiguous runs where the effective exercise changes", () => {
    // sets 0,1 = cable raise; set 2 = leaning cable raise variant.
    const leaningCableRaise = makeExercise(
      "ex-leaning-cable-raise",
      "Leaning Cable Raise",
    );
    const be = makeBlockExercise({
      sets: 3,
      setVariants: { 2: leaningCableRaise },
    });
    expect(groupSetsByVariant(be)).toEqual([
      { exercise: cableRaise, setIndices: [0, 1] },
      { exercise: leaningCableRaise, setIndices: [2] },
    ]);
  });

  it("yields one group when every set is uniformly overridden to the same variant", () => {
    const leaningCableRaise = makeExercise(
      "ex-leaning-cable-raise",
      "Leaning Cable Raise",
    );
    const be = makeBlockExercise({
      sets: 2,
      setVariants: { 0: leaningCableRaise, 1: leaningCableRaise },
    });
    expect(groupSetsByVariant(be)).toEqual([
      { exercise: leaningCableRaise, setIndices: [0, 1] },
    ]);
  });
});

describe("resolveGroupStyle", () => {
  it("is null when no set in the group has any style at all", () => {
    const be = makeBlockExercise();
    expect(resolveGroupStyle(be, [0, 1, 2])).toBeNull();
  });

  it("is uniform when every set in the group shares the placement's own style_id", () => {
    const be = makeBlockExercise({
      style_id: "style-warmup",
      style: makeStyle("style-warmup", "Warm Up"),
    });
    expect(resolveGroupStyle(be, [0, 1])).toEqual({
      name: "Warm Up",
      uniform: true,
    });
  });

  it("matches the exercise+style split from a variant switch partway through a placement", () => {
    // exercise=Cable Raise, sets 0+1 = Cable Raise / Warm Up, set 2 =
    // Leaning Cable Raise variant / Go Hard style — each group is uniform on
    // its own style even though the placement as a whole isn't.
    const leaningCableRaise = makeExercise(
      "ex-leaning-cable-raise",
      "Leaning Cable Raise",
    );
    const warmUp = makeStyle("style-warmup", "Warm Up");
    const goHard = makeStyle("style-go-hard", "Go Hard");
    const be = makeBlockExercise({
      sets: 3,
      style_id: warmUp.id,
      style: warmUp,
      setVariants: { 2: leaningCableRaise },
      setStyles: { 2: goHard },
    });

    const groups = groupSetsByVariant(be);
    expect(groups).toEqual([
      { exercise: cableRaise, setIndices: [0, 1] },
      { exercise: leaningCableRaise, setIndices: [2] },
    ]);
    expect(resolveGroupStyle(be, groups[0]!.setIndices)).toEqual({
      name: "Warm Up",
      uniform: true,
    });
    expect(resolveGroupStyle(be, groups[1]!.setIndices)).toEqual({
      name: "Go Hard",
      uniform: true,
    });
  });

  it("is not uniform when the group's sets disagree on style — winner still wins on plurality", () => {
    const warmUp = makeStyle("style-warmup", "Warm Up");
    const goHard = makeStyle("style-go-hard", "Go Hard");
    const be = makeBlockExercise({
      sets: 3,
      style_id: warmUp.id,
      style: warmUp,
      // sets: [Warm Up, Warm Up, Go Hard] — Warm Up wins 2-1, but not unanimous.
      setStyles: { 2: goHard },
    });
    expect(resolveGroupStyle(be, [0, 1, 2])).toEqual({
      name: "Warm Up",
      uniform: false,
    });
  });

  it("treats an explicit null override as 'no style' for that set", () => {
    const be = makeBlockExercise({
      sets: 2,
      style_id: "style-warmup",
      style: makeStyle("style-warmup", "Warm Up"),
      setStyles: { 0: null },
    });
    // set 0 explicitly has no style, set 1 inherits "Warm Up" — tied 1-1,
    // earliest (set 0, "no style") wins, so no style at all.
    expect(resolveGroupStyle(be, [0, 1])).toBeNull();
  });
});

describe("resolveSetStyle", () => {
  it("is the placement's own style when the set has no override", () => {
    const warmUp = makeStyle("style-warmup", "Warm Up");
    const be = makeBlockExercise({ style_id: warmUp.id, style: warmUp });
    expect(resolveSetStyle(be, 0)).toBe(warmUp);
  });

  it("is the override style for a set that has one", () => {
    const warmUp = makeStyle("style-warmup", "Warm Up");
    const goHard = makeStyle("style-go-hard", "Go Hard");
    const be = makeBlockExercise({
      sets: 2,
      style_id: warmUp.id,
      style: warmUp,
      setStyles: { 1: goHard },
    });
    expect(resolveSetStyle(be, 0)).toBe(warmUp);
    expect(resolveSetStyle(be, 1)).toBe(goHard);
  });

  it("is null for a set explicitly overridden to no style", () => {
    const warmUp = makeStyle("style-warmup", "Warm Up");
    const be = makeBlockExercise({
      sets: 2,
      style_id: warmUp.id,
      style: warmUp,
      setStyles: { 0: null },
    });
    expect(resolveSetStyle(be, 0)).toBeNull();
    expect(resolveSetStyle(be, 1)).toBe(warmUp);
  });
});
