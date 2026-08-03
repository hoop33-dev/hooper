import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  EnteredBy,
} from "@hooper/db";
import { describe, expect, it, vi } from "vitest";
import {
  findExerciseMeasurements,
  runSaveExerciseMeasurement,
  runSaveSupersetMeasurements,
} from "./useBlockActions";

const exercise = {
  id: "ex-1",
  name: "Bench Press",
  description: null,
  video_url: null,
  video_source: null,
  created_by: "coach-1",
  created_at: "",
  updated_at: "",
  categories: [],
  unitTypes: [],
};

function makeMeasurement(
  blockExerciseId: string,
  value: number,
): BlockExerciseWithDetails["measurements"][number] {
  return {
    block_exercise_id: blockExerciseId,
    position: 0,
    set_index: 0,
    unit_type: "Reps",
    value,
    value_entered_by: "coach" as EnteredBy,
    value_unit: null,
    created_at: "",
    updated_at: "",
  };
}

function makeExerciseRow(
  id: string,
  blockId: string,
  value: number,
): BlockExerciseWithDetails {
  return {
    id,
    block_id: blockId,
    exercise_id: exercise.id,
    position: 0,
    sets: 1,
    notes: null,
    link_group_id: null,
    created_at: "",
    updated_at: "",
    exercise,
    measurements: [makeMeasurement(id, value)],
  };
}

function makeBlock(
  id: string,
  exercises: BlockExerciseWithDetails[],
  isSuperset = false,
): BlockWithExercises {
  return {
    id,
    session_id: "session-1",
    name: "Block",
    color: "blue",
    position: 0,
    link_group_id: null,
    is_superset: isSuperset,
    sets: null,
    created_at: "",
    updated_at: "",
    exercises,
  };
}

function makeSaveData(sets: number) {
  return {
    sets,
    measurements: [
      {
        unit_type: "Reps",
        value_unit: null,
        sets: [{ value: sets, value_entered_by: "coach" as EnteredBy }],
      },
    ],
  };
}

/** A fake ctx backed by a mutable local array, mirroring how the real
 * blocksRef-backed ctx lets an async continuation read state as it stands
 * after the setBlocks calls made during the await. */
function makeFakeCtx(initialBlocks: BlockWithExercises[]) {
  let current = initialBlocks;
  const setBlocks = vi.fn((next: BlockWithExercises[]) => {
    current = next;
  });
  return {
    blocks: initialBlocks,
    setBlocks,
    getBlocks: () => current,
    showError: vi.fn(),
    onSaved: vi.fn(),
  };
}

describe("findExerciseMeasurements", () => {
  it("returns the measurements for an exercise that exists", () => {
    const row = makeExerciseRow("be-1", "block-1", 10);
    const blocks = [makeBlock("block-1", [row])];
    expect(findExerciseMeasurements(blocks, "be-1")).toBe(row.measurements);
  });

  it("returns undefined for an exercise not in any block", () => {
    const blocks = [
      makeBlock("block-1", [makeExerciseRow("be-1", "block-1", 10)]),
    ];
    expect(findExerciseMeasurements(blocks, "missing")).toBeUndefined();
  });
});

describe("runSaveExerciseMeasurement", () => {
  it("merges a successful save against the latest state, not the pre-save snapshot", async () => {
    const editing = makeExerciseRow("be-1", "block-1", 10);
    const initialBlocks = [makeBlock("block-1", [editing])];
    const ctx = makeFakeCtx(initialBlocks);

    const confirmedRow = { ...editing, sets: 5, notes: "done" };
    const updateBlockExerciseAction = vi.fn(async () => {
      // A concurrent edit lands elsewhere in the blocks array while this
      // save is in flight (the modal already closed via onSaved()).
      const concurrentBlock = makeBlock("block-2", []);
      ctx.setBlocks([...ctx.getBlocks(), concurrentBlock]);
      return { ok: true, data: confirmedRow };
    });

    await runSaveExerciseMeasurement(makeSaveData(5), undefined, editing, {
      ...ctx,
      updateBlockExerciseAction,
    });

    expect(ctx.onSaved).toHaveBeenCalledTimes(1);
    const final = ctx.getBlocks();
    expect(final.some((b) => b.id === "block-2")).toBe(true);
    const patched = final
      .flatMap((b) => b.exercises)
      .find((e) => e.id === "be-1");
    expect(patched?.notes).toBe("done");
    expect(patched?.sets).toBe(5);
  });

  it("on failure, reverts only the edited exercise and keeps concurrent edits", async () => {
    const editing = makeExerciseRow("be-1", "block-1", 10);
    const initialBlocks = [makeBlock("block-1", [editing])];
    const ctx = makeFakeCtx(initialBlocks);

    const updateBlockExerciseAction = vi.fn(async () => {
      const concurrentBlock = makeBlock("block-2", []);
      ctx.setBlocks([...ctx.getBlocks(), concurrentBlock]);
      return { ok: false, error: "save failed" };
    });

    await runSaveExerciseMeasurement(makeSaveData(5), undefined, editing, {
      ...ctx,
      updateBlockExerciseAction,
    });

    expect(ctx.showError).toHaveBeenCalledWith("save failed");
    const final = ctx.getBlocks();
    expect(final.some((b) => b.id === "block-2")).toBe(true);
    const reverted = final
      .flatMap((b) => b.exercises)
      .find((e) => e.id === "be-1");
    expect(reverted?.sets).toBe(editing.sets);
    expect(reverted?.measurements).toBe(editing.measurements);
  });
});

describe("runSaveSupersetMeasurements", () => {
  it("keeps already-confirmed exercises and concurrent edits when a later exercise fails", async () => {
    const e1 = makeExerciseRow("be-1", "block-1", 1);
    const e2 = makeExerciseRow("be-2", "block-1", 2);
    const e3 = makeExerciseRow("be-3", "block-1", 3);
    const initialBlocks = [makeBlock("block-1", [e1, e2, e3], true)];
    const ctx = makeFakeCtx(initialBlocks);

    const confirmedE1 = { ...e1, measurements: [makeMeasurement("be-1", 100)] };
    const updateBlockExerciseAction = vi.fn(async (id: string) => {
      if (id === "be-1") return { ok: true, data: confirmedE1 };
      if (id === "be-2") {
        // A concurrent edit lands elsewhere while be-2's save is in flight.
        const concurrentBlock = makeBlock("block-2", []);
        ctx.setBlocks([...ctx.getBlocks(), concurrentBlock]);
        return { ok: false, error: "save failed" };
      }
      throw new Error("be-3 should never be attempted after be-2 fails");
    });

    await runSaveSupersetMeasurements(
      [
        { id: "be-1", measurements: [] },
        { id: "be-2", measurements: [] },
        { id: "be-3", measurements: [] },
      ],
      { ...ctx, updateBlockExerciseAction },
    );

    expect(updateBlockExerciseAction).toHaveBeenCalledTimes(2);
    expect(ctx.showError).toHaveBeenCalledWith("save failed");

    const final = ctx.getBlocks();
    expect(final.some((b) => b.id === "block-2")).toBe(true);
    const rows = final.flatMap((b) => b.exercises);

    // be-1 already succeeded before be-2 failed — keeps its confirmed data.
    expect(rows.find((r) => r.id === "be-1")?.measurements).toBe(
      confirmedE1.measurements,
    );
    // be-2 (the failed one) and be-3 (never attempted) revert to their
    // pre-edit measurements, not to the whole pre-loop snapshot.
    expect(rows.find((r) => r.id === "be-2")?.measurements).toBe(
      e2.measurements,
    );
    expect(rows.find((r) => r.id === "be-3")?.measurements).toBe(
      e3.measurements,
    );
  });
});
