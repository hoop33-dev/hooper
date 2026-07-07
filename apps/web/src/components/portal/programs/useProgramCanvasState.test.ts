import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  SessionWithBlocks,
} from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  linkedWeeksOfExercise,
  linkedWeeksOfSession,
  selectWeekAfterDelete,
} from "./useProgramCanvasState";

function exercise(
  id: string,
  linkGroupId: string | null,
): BlockExerciseWithDetails {
  return {
    id,
    block_id: "b1",
    exercise_id: "ex1",
    position: 0,
    sets: 1,
    notes: null,
    link_group_id: linkGroupId,
    created_at: "",
    updated_at: "",
    exercise: {
      id: "ex1",
      name: "Bench Press",
      description: null,
      video_url: null,
      video_source: null,
      created_by: "coach1",
      created_at: "",
      updated_at: "",
      categories: [],
      unitTypes: ["Reps"],
    },
    measurements: [],
  };
}

function block(
  id: string,
  exercises: BlockExerciseWithDetails[],
): BlockWithExercises {
  return {
    id,
    session_id: "s1",
    name: "Warm-up",
    color: "#000000",
    position: 0,
    link_group_id: null,
    created_at: "",
    updated_at: "",
    exercises,
  };
}

function session(
  id: string,
  weekNumber: number,
  linkGroupId: string | null,
  blocks: BlockWithExercises[] = [],
): SessionWithBlocks {
  return {
    id,
    program_id: "p1",
    week_number: weekNumber,
    name: "Leg Day",
    position: 0,
    link_group_id: linkGroupId,
    created_at: "",
    updated_at: "",
    blocks,
  };
}

describe("linkedWeeksOfSession", () => {
  it("returns just its own week when unlinked", () => {
    const s = session("s1", 2, null);
    expect(linkedWeeksOfSession(s, [s])).toEqual([2]);
  });

  it("returns every week sharing the session's link group, sorted", () => {
    const s1 = session("s1", 1, "group-a");
    const s3 = session("s3", 3, "group-a");
    const s5 = session("s5", 5, "group-a");
    const unrelated = session("s7", 7, "group-b");
    expect(linkedWeeksOfSession(s3, [s5, s1, s3, unrelated])).toEqual([
      1, 3, 5,
    ]);
  });
});

describe("linkedWeeksOfExercise", () => {
  it("returns undefined for a null exercise", () => {
    expect(linkedWeeksOfExercise(null, [])).toBeUndefined();
  });

  it("returns undefined when the exercise isn't linked", () => {
    const ex = exercise("e1", null);
    expect(linkedWeeksOfExercise(ex, [])).toBeUndefined();
  });

  it("finds every week containing a placement in the same exercise group", () => {
    const linked = exercise("e1", "ex-group-a");
    const week1 = session("s1", 1, null, [block("b1", [linked])]);
    const week3 = session("s3", 3, null, [
      block("b3", [exercise("e3", "ex-group-a")]),
    ]);
    const week5unrelated = session("s5", 5, null, [
      block("b5", [exercise("e5", "other-group")]),
    ]);
    expect(
      linkedWeeksOfExercise(linked, [week1, week3, week5unrelated]),
    ).toEqual([1, 3]);
  });

  it("returns undefined when the group has shrunk to just itself", () => {
    const linked = exercise("e1", "ex-group-a");
    const week1 = session("s1", 1, null, [block("b1", [linked])]);
    expect(linkedWeeksOfExercise(linked, [week1])).toBeUndefined();
  });
});

describe("selectWeekAfterDelete", () => {
  it("leaves the selection untouched when it's before the deleted week", () => {
    expect(selectWeekAfterDelete(3, 1)).toBe(1);
  });

  it("shifts the selection down when it's after the deleted week", () => {
    expect(selectWeekAfterDelete(2, 4)).toBe(3);
  });

  it("falls back to the previous week when the selected week is deleted", () => {
    expect(selectWeekAfterDelete(3, 3)).toBe(2);
  });

  it("clamps to week 1 when week 1 is deleted while selected", () => {
    expect(selectWeekAfterDelete(1, 1)).toBe(1);
  });
});
