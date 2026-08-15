import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { describe, expect, it } from "vitest";
import { computeBlockMove, computeExerciseMove } from "./dropComputation";

function makeExercise(id: string): ExerciseWithDetails {
  return {
    id,
    name: id,
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
    unitTypeIds: [],
    defaultStyle: null,
    variants: [],
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
    notes: null,
    link_group_id: null,
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise: makeExercise(id),
    setVariants: {},
    setStyles: {},
    measurements: [
      {
        block_exercise_id: id,
        position: 0,
        set_index: 0,
        unit_type: "Reps",
        value: 10,
        value_entered_by: "coach",
        value_unit: null,
        created_at: "",
        updated_at: "",
      },
    ],
  };
}

function makeBlock(
  id: string,
  position: number,
  exerciseIds: string[],
  sessionId = "s1",
): BlockWithExercises {
  return {
    id,
    session_id: sessionId,
    name: id,
    color: "#000000",
    position,
    link_group_id: null,
    is_superset: false,
    sets: null,
    created_at: "",
    updated_at: "",
    exercises: exerciseIds.map((exId, i) => ({
      ...makeBlockExercise(exId, i),
      block_id: id,
    })),
  };
}

describe("computeBlockMove", () => {
  it("reorders two blocks within the same session when dropping after", () => {
    const blocks = [makeBlock("b1", 0, []), makeBlock("b2", 1, [])];
    const result = computeBlockMove(blocks, "b1", "s1", "b2", true);
    expect(result).not.toBeNull();
    expect(result!.blocks.map((b) => b.id)).toEqual(["b2", "b1"]);
    expect(result!.updates).toEqual([
      { id: "b2", session_id: "s1", position: 0 },
      { id: "b1", session_id: "s1", position: 1 },
    ]);
  });

  it("returns null when dropping back into the same slot (before next block)", () => {
    const blocks = [makeBlock("b1", 0, []), makeBlock("b2", 1, [])];
    expect(computeBlockMove(blocks, "b1", "s1", "b2", false)).toBeNull();
  });

  it("returns null when active and over are the same block", () => {
    const blocks = [makeBlock("b1", 0, []), makeBlock("b2", 1, [])];
    expect(computeBlockMove(blocks, "b1", "s1", "b1")).toBeNull();
  });

  it("returns null when the active block id is not found", () => {
    const blocks = [makeBlock("b1", 0, [])];
    expect(computeBlockMove(blocks, "missing", "s1", null)).toBeNull();
  });

  it("moves a block into a different session and resequences both sides", () => {
    const blocks = [
      makeBlock("b1", 0, [], "s1"),
      makeBlock("b2", 1, [], "s1"),
      makeBlock("b3", 0, [], "s2"),
    ];
    const result = computeBlockMove(blocks, "b1", "s2", "b3", false);
    expect(result).not.toBeNull();

    const s1Blocks = result!.blocks.filter((b) => b.session_id === "s1");
    const s2Blocks = result!.blocks.filter((b) => b.session_id === "s2");
    expect(s1Blocks.map((b) => b.id)).toEqual(["b2"]);
    expect(s2Blocks.map((b) => b.id)).toEqual(["b1", "b3"]);
    expect(s2Blocks.find((b) => b.id === "b1")!.session_id).toBe("s2");

    expect(result!.updates).toEqual(
      expect.arrayContaining([
        { id: "b1", session_id: "s2", position: 0 },
        { id: "b3", session_id: "s2", position: 1 },
        { id: "b2", session_id: "s1", position: 0 },
      ]),
    );
    expect(result!.updates).toHaveLength(3);
  });

  it("appends to the end of a different session when overBlockId is null", () => {
    const blocks = [makeBlock("b1", 0, [], "s1"), makeBlock("b2", 0, [], "s2")];
    const result = computeBlockMove(blocks, "b1", "s2", null);
    const s2Blocks = result!.blocks.filter((b) => b.session_id === "s2");
    expect(s2Blocks.map((b) => b.id)).toEqual(["b2", "b1"]);
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

  it("inserts after the over exercise when insertAfter is set", () => {
    const blocks = [makeBlock("b1", 0, ["e1", "e2", "e3"])];
    const result = computeExerciseMove(blocks, "e1", "b1", "b1", "e2", true);
    expect(result!.blocks[0].exercises.map((e) => e.id)).toEqual([
      "e2",
      "e1",
      "e3",
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
