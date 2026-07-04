import { describe, expect, it } from "vitest";
import {
  createPendingBlock,
  createPendingExercise,
  isPending,
} from "./pendingRows";

const exercise = {
  id: "ex-1",
  name: "Bench Press",
  description: null,
  video_url: null,
  created_by: "coach-1",
  created_at: "",
  updated_at: "",
  categories: [],
  unitTypes: [],
};

describe("isPending", () => {
  it("is false for a plain row", () => {
    expect(isPending({ id: "be-1", block_id: "b1" })).toBe(false);
  });

  it("is true for a pending row", () => {
    expect(isPending(createPendingExercise("b1", exercise))).toBe(true);
  });

  it("handles null/primitive input without throwing", () => {
    expect(isPending(null)).toBe(false);
    expect(isPending(undefined)).toBe(false);
    expect(isPending("string")).toBe(false);
  });
});

describe("createPendingExercise", () => {
  it("builds a row that looks like a real one but is marked pending", () => {
    const row = createPendingExercise("block-1", exercise);
    expect(row.block_id).toBe("block-1");
    expect(row.exercise_id).toBe(exercise.id);
    expect(row.exercise).toBe(exercise);
    expect(row.pending).toBe(true);
    expect(row.measurements).toEqual([]);
  });

  it("gives each pending row a unique id", () => {
    const a = createPendingExercise("block-1", exercise);
    const b = createPendingExercise("block-1", exercise);
    expect(a.id).not.toBe(b.id);
  });
});

describe("createPendingBlock", () => {
  it("wraps a single pending exercise and matches the block's own row", () => {
    const block = createPendingBlock("session-1", exercise);
    expect(block.session_id).toBe("session-1");
    expect(block.pending).toBe(true);
    expect(block.exercises).toHaveLength(1);
    expect(block.exercises[0].block_id).toBe(block.id);
    expect(isPending(block.exercises[0])).toBe(true);
  });

  it("picks the same color the server would derive for a new, unnamed block", () => {
    const a = createPendingBlock("session-1", exercise);
    const b = createPendingBlock("session-2", exercise);
    // Both default to "New block" — same name means same deterministic color.
    expect(a.color).toBe(b.color);
  });
});
