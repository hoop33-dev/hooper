import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ProgramWithSessions,
  SessionWithBlocks,
} from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  linkedWeeksOfExercise,
  linkedWeeksOfSession,
  optimisticSession,
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
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise: {
      id: "ex1",
      name: "Bench Press",
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
      categories: [],
      unitTypes: ["Reps"],
      unitTypeIds: [],
      defaultStyle: null,
      variants: [],
    },
    measurements: [],
    setVariants: {},
    setStyles: {},
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
    is_superset: false,
    sets: null,
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

describe("optimisticSession", () => {
  const program = { id: "p1", weeks: 4 } as ProgramWithSessions;

  it("uses the typed name for a blank session and lands it after its siblings", () => {
    const existing = [session("s1", 2, null), session("s2", 2, null)];
    existing[0].position = 0;
    existing[1].position = 1;
    const ghost = optimisticSession(
      { mode: "blank", name: "Upper Body", week_number: 2 },
      program,
      existing,
    );
    expect(ghost.name).toBe("Upper Body");
    expect(ghost.week_number).toBe(2);
    expect(ghost.position).toBe(2);
    expect(ghost.blocks).toEqual([]);
  });

  it("starts at position 0 when the week has no sessions yet", () => {
    const ghost = optimisticSession(
      { mode: "blank", name: "Day 1", week_number: 3 },
      program,
      [session("s1", 1, null)],
    );
    expect(ghost.position).toBe(0);
  });

  it("shows a placeholder name for copy/template modes", () => {
    const ghost = optimisticSession(
      { mode: "copy", sourceSessionId: "s9", week_number: 1 },
      program,
      [],
    );
    expect(ghost.name).toBe("New session…");
  });

  it("seeds a pending block holding the dragged exercise", () => {
    const seed = exercise("e1", null).exercise;
    const ghost = optimisticSession(
      { mode: "blank", name: "Upper Body", week_number: 1 },
      program,
      [],
      seed,
    );
    expect(ghost.blocks).toHaveLength(1);
    expect(ghost.blocks[0]).toMatchObject({ pending: true });
    expect(ghost.blocks[0].exercises).toHaveLength(1);
    expect(ghost.blocks[0].exercises[0]).toMatchObject({
      exercise_id: "ex1",
      pending: true,
    });
  });

  it("ignores the seed exercise for copy/template modes", () => {
    const seed = exercise("e1", null).exercise;
    const ghost = optimisticSession(
      { mode: "template", sessionTemplateId: "t1", week_number: 1 },
      program,
      [],
      seed,
    );
    expect(ghost.blocks).toEqual([]);
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
