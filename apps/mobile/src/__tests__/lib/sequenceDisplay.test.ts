import {
  sequenceChainLabel,
  sequenceChangeCount,
  sequenceSetSteps,
} from "@/src/lib/sequenceDisplay";
import type { AthleteExercise, AthleteSequence } from "@hooper/api";

function ex(id: string): AthleteExercise {
  return {
    id,
    name: id.toUpperCase(),
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
    photos: [],
  };
}

const sequence: AthleteSequence = {
  name: "Wing attack",
  description: null,
  steps: [
    {
      id: "s1",
      position: 0,
      label: "Dribble",
      picks: { 0: ex("h1"), 3: ex("h6") },
    },
    { id: "s2", position: 1, label: "Pass", picks: { 0: ex("p3") } },
    {
      id: "s3",
      position: 2,
      label: "Finish",
      picks: { 0: ex("f3"), 1: ex("f4"), 2: ex("f5") },
    },
    { id: "s4", position: 3, label: "Cut", picks: {} },
  ],
};

describe("sequenceSetSteps", () => {
  it("never marks the first set as changed", () => {
    const steps = sequenceSetSteps(sequence, 0);
    expect(steps.map((s) => s.exercise?.id ?? null)).toEqual([
      "h1",
      "p3",
      "f3",
      null,
    ]);
    expect(steps.every((s) => !s.changed && s.previous === null)).toBe(true);
  });

  it("carries earlier picks forward and flags only the swapped steps", () => {
    const steps = sequenceSetSteps(sequence, 2);
    expect(steps.map((s) => s.exercise?.id ?? null)).toEqual([
      "h1",
      "p3",
      "f5",
      null,
    ]);
    expect(steps.map((s) => s.changed)).toEqual([false, false, true, false]);
    expect(steps[2]!.previous?.id).toBe("f4");
  });

  it("leaves an empty step unchanged on later sets", () => {
    expect(sequenceSetSteps(sequence, 3)[3]).toMatchObject({
      exercise: null,
      changed: false,
    });
  });
});

describe("sequenceChangeCount", () => {
  it("counts the steps a set swaps", () => {
    expect(sequenceChangeCount(sequence, 0)).toBe(0);
    expect(sequenceChangeCount(sequence, 1)).toBe(1);
    expect(sequenceChangeCount(sequence, 3)).toBe(1);
  });
});

describe("sequenceChainLabel", () => {
  it("falls back to the step label for an empty step", () => {
    expect(sequenceChainLabel(sequence, 3)).toBe("H6 → P3 → F5 → Cut");
  });
});
