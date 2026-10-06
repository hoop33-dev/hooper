import { describe, expect, it } from "vitest";
import { computeWeekDiff } from "./session.service";

describe("computeWeekDiff", () => {
  it("adds newly-ticked weeks and removes newly-unticked ones", () => {
    // Linked at weeks 1 (own), 3, 5 — coach unticks 5, ticks 6.
    const currentMembers = [
      { id: "s1", week_number: 1 },
      { id: "s3", week_number: 3 },
      { id: "s5", week_number: 5 },
    ];
    const { toAddWeeks, toRemoveIds } = computeWeekDiff(
      currentMembers,
      [1, 3, 6],
      1,
    );
    expect(toAddWeeks).toEqual([6]);
    expect(toRemoveIds).toEqual(["s5"]);
  });

  it("never treats the session's own week as addable or removable", () => {
    const currentMembers = [{ id: "s1", week_number: 1 }];
    // Caller omits its own week entirely, and also asks to remove it.
    const omitted = computeWeekDiff(currentMembers, [3], 1);
    expect(omitted.toAddWeeks).toEqual([3]);
    expect(omitted.toRemoveIds).toEqual([]);

    const explicitRemoval = computeWeekDiff(currentMembers, [], 1);
    expect(explicitRemoval.toAddWeeks).toEqual([]);
    expect(explicitRemoval.toRemoveIds).toEqual([]);
  });

  it("is a no-op when the target set matches the current one", () => {
    const currentMembers = [
      { id: "s1", week_number: 1 },
      { id: "s3", week_number: 3 },
    ];
    const { toAddWeeks, toRemoveIds } = computeWeekDiff(
      currentMembers,
      [1, 3],
      1,
    );
    expect(toAddWeeks).toEqual([]);
    expect(toRemoveIds).toEqual([]);
  });

  it("handles first-time linking (no current members but itself)", () => {
    const currentMembers = [{ id: "s1", week_number: 1 }];
    const { toAddWeeks, toRemoveIds } = computeWeekDiff(
      currentMembers,
      [1, 3, 5],
      1,
    );
    expect(toAddWeeks).toEqual([3, 5]);
    expect(toRemoveIds).toEqual([]);
  });

  it("removes every other member when unlinking down to just itself", () => {
    const currentMembers = [
      { id: "s1", week_number: 1 },
      { id: "s3", week_number: 3 },
      { id: "s5", week_number: 5 },
    ];
    const { toAddWeeks, toRemoveIds } = computeWeekDiff(currentMembers, [1], 1);
    expect(toAddWeeks).toEqual([]);
    expect(toRemoveIds.sort()).toEqual(["s3", "s5"]);
  });
});
