import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { describe, expect, it } from "vitest";
import { computeBlockReorder, computeExerciseMove } from "./dropComputation";

function makeExercise(id: string): ExerciseWithDetails {
  return {
    id,
    name: id,
    description: null,
    video_url: null,
    created_by: "coach1",
    created_at: "",
    updated_at: "",
    categories: [],
    unitTypes: ["Reps"],
  };
}

function makeBlockExercise(
  id: string,
  position: number,
): BlockExerciseWithDetails {
  return {
    id,
    block_id: "",
    exercise_id: id,
    position,
    sets: 3,
    unit_type: "Reps",
    reps: 10,
    value: null,
    notes: null,
    created_at: "",
    updated_at: "",
    exercise: makeExercise(id),
  };
}

function makeBlock(
  id: string,
  position: number,
  exerciseIds: string[],
): BlockWithExercises {
  return {
    id,
    session_id: "s1",
    name: id,
    color: "#000000",
    position,
    created_at: "",
    updated_at: "",
    exercises: exerciseIds.map((exId, i) => ({
      ...makeBlockExercise(exId, i),
      block_id: id,
    })),
  };
}

describe("computeBlockReorder", () => {
  it("reorders two blocks and resequences positions", () => {
    const blocks = [makeBlock("b1", 0, []), makeBlock("b2", 1, [])];
    const result = computeBlockReorder(blocks, "b1", "b2");
    expect(result).not.toBeNull();
    expect(result!.blocks.map((b) => b.id)).toEqual(["b2", "b1"]);
    expect(result!.updates).toEqual([
      { id: "b2", position: 0 },
      { id: "b1", position: 1 },
    ]);
  });

  it("returns null when active and over are the same block", () => {
    const blocks = [makeBlock("b1", 0, []), makeBlock("b2", 1, [])];
    expect(computeBlockReorder(blocks, "b1", "b1")).toBeNull();
  });

  it("returns null when a block id is not found", () => {
    const blocks = [makeBlock("b1", 0, [])];
    expect(computeBlockReorder(blocks, "b1", "missing")).toBeNull();
  });
});

describe("computeExerciseMove", () => {
  it("reorders exercises within the same block", () => {
    const blocks = [makeBlock("b1", 0, ["e1", "e2", "e3"])];
    const result = computeExerciseMove(blocks, "e1", "b1", "b1", "e3");
    expect(result).not.toBeNull();
    const ids = result!.blocks[0].exercises.map((e) => e.id);
    expect(ids).toEqual(["e2", "e1", "e3"]);
    expect(result!.updates).toEqual([
      { id: "e2", block_id: "b1", position: 0 },
      { id: "e1", block_id: "b1", position: 1 },
      { id: "e3", block_id: "b1", position: 2 },
    ]);
  });

  it("appends to the end of the same block when overExerciseId is null", () => {
    const blocks = [makeBlock("b1", 0, ["e1", "e2"])];
    const result = computeExerciseMove(blocks, "e1", "b1", "b1", null);
    expect(result!.blocks[0].exercises.map((e) => e.id)).toEqual(["e2", "e1"]);
  });

  it("moves an exercise across blocks and resequences both sides", () => {
    const blocks = [
      makeBlock("b1", 0, ["e1", "e2"]),
      makeBlock("b2", 1, ["e3"]),
    ];
    const result = computeExerciseMove(blocks, "e1", "b1", "b2", "e3");
    expect(result).not.toBeNull();

    const b1 = result!.blocks.find((b) => b.id === "b1")!;
    const b2 = result!.blocks.find((b) => b.id === "b2")!;
    expect(b1.exercises.map((e) => e.id)).toEqual(["e2"]);
    expect(b2.exercises.map((e) => e.id)).toEqual(["e1", "e3"]);
    // moved exercise's block_id is updated to the new block
    expect(b2.exercises.find((e) => e.id === "e1")!.block_id).toBe("b2");

    expect(result!.updates).toEqual(
      expect.arrayContaining([
        { id: "e2", block_id: "b1", position: 0 },
        { id: "e1", block_id: "b2", position: 0 },
        { id: "e3", block_id: "b2", position: 1 },
      ]),
    );
    expect(result!.updates).toHaveLength(3);
  });

  it("appends to the end of a different block when overExerciseId is null", () => {
    const blocks = [makeBlock("b1", 0, ["e1"]), makeBlock("b2", 1, ["e2"])];
    const result = computeExerciseMove(blocks, "e1", "b1", "b2", null);
    const b2 = result!.blocks.find((b) => b.id === "b2")!;
    expect(b2.exercises.map((e) => e.id)).toEqual(["e2", "e1"]);
  });

  it("returns null when the dragged exercise is not found", () => {
    const blocks = [makeBlock("b1", 0, ["e1"])];
    expect(computeExerciseMove(blocks, "missing", "b1", "b1", null)).toBeNull();
  });

  it("returns null when source or target block is not found", () => {
    const blocks = [makeBlock("b1", 0, ["e1"])];
    expect(computeExerciseMove(blocks, "e1", "b1", "missing", null)).toBeNull();
  });
});
