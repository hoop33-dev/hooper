import {
  addSequenceSet,
  clearStepPick,
  duplicateSequenceSet,
  normalizeStepPicks,
  pickStepExercise,
  removeSequenceSet,
  resizeSequenceSets,
  resolveStepPick,
  sequenceChainIds,
  sequenceVaries,
  type SequenceDraft,
} from "@hooper/shared";
import { describe, expect, it } from "vitest";

type Draft = SequenceDraft<{ reps: number }> & { name: string };

function draft(picks: Record<number, string>[], sets = 3): Draft {
  return {
    name: "Wing attack",
    steps: picks.map((p, i) => ({
      id: `s${i}`,
      label: `Step ${i + 1}`,
      category_id: null,
      picks: p,
    })),
    sets: Array.from({ length: sets }, (_, i) => ({ reps: i + 1 })),
  };
}

const clone = (set: { reps: number } | undefined) => ({ reps: set?.reps ?? 1 });

describe("resolveStepPick", () => {
  it("carries the latest earlier pick forward", () => {
    const step = { picks: { 0: "a", 2: "b" } };
    expect(resolveStepPick(step, 0)).toEqual({
      exerciseId: "a",
      inherited: false,
      from: 0,
    });
    expect(resolveStepPick(step, 1)).toEqual({
      exerciseId: "a",
      inherited: true,
      from: 0,
    });
    expect(resolveStepPick(step, 3)).toEqual({
      exerciseId: "b",
      inherited: true,
      from: 2,
    });
  });

  it("is empty when nothing is picked yet", () => {
    expect(resolveStepPick({ picks: {} }, 1).exerciseId).toBeNull();
  });
});

describe("normalizeStepPicks", () => {
  it("drops repeats and picks past the set count", () => {
    expect(normalizeStepPicks({ 0: "a", 1: "a", 2: "b", 5: "c" }, 3)).toEqual({
      0: "a",
      2: "b",
    });
  });
});

describe("pickStepExercise", () => {
  it("changes later inherited sets along with set 1", () => {
    const next = pickStepExercise(draft([{ 0: "a" }]), 0, "s0", "z");
    expect(sequenceChainIds(next.steps, 2)).toEqual(["z"]);
    expect(next.name).toBe("Wing attack");
  });

  it("stores nothing when the pick matches what the set inherits", () => {
    const next = pickStepExercise(draft([{ 0: "a" }]), 1, "s0", "a");
    expect(next.steps[0]!.picks).toEqual({ 0: "a" });
    expect(sequenceVaries(next.steps)).toBe(false);
  });

  it("records a per-set change", () => {
    const next = pickStepExercise(draft([{ 0: "a" }]), 1, "s0", "b");
    expect(next.steps[0]!.picks).toEqual({ 0: "a", 1: "b" });
    expect(sequenceVaries(next.steps)).toBe(true);
  });
});

describe("clearStepPick", () => {
  it("goes back to carrying the earlier set", () => {
    const next = clearStepPick(draft([{ 0: "a", 1: "b" }]), 1, "s0");
    expect(next.steps[0]!.picks).toEqual({ 0: "a" });
  });
});

describe("sets", () => {
  it("adds a set that carries every step forward", () => {
    const next = addSequenceSet(draft([{ 0: "a", 2: "b" }]), clone);
    expect(next.sets).toHaveLength(4);
    expect(sequenceChainIds(next.steps, 3)).toEqual(["b"]);
  });

  it("duplicates a set's resolved exercises onto the new last set", () => {
    const next = duplicateSequenceSet(draft([{ 0: "a", 2: "b" }]), 1, clone);
    expect(next.sets).toHaveLength(4);
    expect(sequenceChainIds(next.steps, 3)).toEqual(["a"]);
    expect(next.sets[3]).toEqual({ reps: 2 });
  });

  it("removing set 1 hands its definition to the next set", () => {
    const next = removeSequenceSet(draft([{ 0: "a", 2: "b" }]), 0);
    expect(next.sets).toHaveLength(2);
    expect(sequenceChainIds(next.steps, 0)).toEqual(["a"]);
    expect(sequenceChainIds(next.steps, 1)).toEqual(["b"]);
  });

  it("removing a middle set shifts later picks down", () => {
    const next = removeSequenceSet(draft([{ 0: "a", 1: "b", 2: "c" }]), 1);
    expect(next.steps[0]!.picks).toEqual({ 0: "a", 1: "c" });
  });

  it("keeps at least one set", () => {
    const one = draft([{ 0: "a" }], 1);
    expect(removeSequenceSet(one, 0)).toBe(one);
  });

  it("resizing trims picks for sets that no longer exist", () => {
    const next = resizeSequenceSets(draft([{ 0: "a", 2: "b" }]), 2, clone);
    expect(next.sets).toHaveLength(2);
    expect(next.steps[0]!.picks).toEqual({ 0: "a" });
  });
});
