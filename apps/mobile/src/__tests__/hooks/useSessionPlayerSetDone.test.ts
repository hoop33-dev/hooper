import type { SetsByBlockExercise } from "@/src/hooks/useSessionPlayer";
import {
  buildInitialSetsState,
  makeSetDoneHandlers,
} from "@/src/hooks/useSessionPlayer";

const mockUpsertSetLogs = jest.fn().mockResolvedValue(undefined);
const mockMarkSetPending = jest.fn().mockResolvedValue(undefined);

jest.mock("@/src/services/measurementLog.service", () => ({
  SET_DONE_MARKER_POSITION: -1,
  SET_DONE_MARKER_UNIT: "set_done",
  upsertSetLogs: (...args: unknown[]) => mockUpsertSetLogs(...args),
  markSetPending: (...args: unknown[]) => mockMarkSetPending(...args),
}));

/** Minimal session shape: one superset block, two exercises ("be1", "be2"),
 * each with 2 rounds and one measurement at position 0 per set. Mirrors the
 * shape useSessionPlayerFieldEditors.test.ts uses for its plain-block case. */
function makeSession() {
  const makeExercise = (id: string) => ({
    id,
    exercise_id: `ex-${id}`,
    sets: 2,
    exercise: { id: `ex-${id}`, name: id },
    measurements: [0, 1].map((set_index) => ({
      block_exercise_id: id,
      position: 0,
      set_index,
      unit_type: "reps",
      value: 10,
      value_entered_by: "coach",
      value_unit: null,
    })),
    setVariants: {},
    setStyles: {},
  });
  return {
    id: "s1",
    blocks: [
      {
        id: "b1",
        is_superset: true,
        exercises: [makeExercise("be1"), makeExercise("be2")],
      },
    ],
  } as never;
}

function harness(initial: SetsByBlockExercise) {
  let state = initial;
  const ref = { current: state };
  const commitSetsState = (next: unknown) => {
    const resolved =
      typeof next === "function" ? (next as any)(ref.current) : next;
    ref.current = resolved;
    state = resolved;
  };
  return {
    ref,
    commitSetsState,
    get state() {
      return state;
    },
  };
}

const completion = { id: "c1" } as never;

const baseSets: SetsByBlockExercise = {
  be1: [
    { done: false, values: { 0: 10 } },
    { done: true, values: { 0: 10 } },
  ],
  be2: [
    { done: false, values: { 0: 10 } },
    { done: false, values: { 0: 10 } },
  ],
};

beforeEach(() => {
  mockUpsertSetLogs.mockClear();
  mockMarkSetPending.mockClear();
});

describe("makeSetDoneHandlers", () => {
  it("setManyDone(targets, true) ticks every not-yet-done target and leaves already-done ones alone", async () => {
    const h = harness(structuredClone(baseSets));
    const { setManyDone } = makeSetDoneHandlers({
      session: makeSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await setManyDone(
      [
        { blockExerciseId: "be1", setIndex: 0 },
        { blockExerciseId: "be1", setIndex: 1 }, // already done — must stay a no-op
        { blockExerciseId: "be2", setIndex: 0 },
        { blockExerciseId: "be2", setIndex: 1 },
      ],
      true,
    );

    expect(h.state.be1.map((s) => s.done)).toEqual([true, true]);
    expect(h.state.be2.map((s) => s.done)).toEqual([true, true]);
    // Only the three sets that weren't already done get persisted — all in
    // one batched request.
    expect(mockUpsertSetLogs).toHaveBeenCalledTimes(1);
    const rows = mockUpsertSetLogs.mock.calls[0][0] as {
      blockExerciseId: string;
      setIndex: number;
    }[];
    expect(rows.map((r) => `${r.blockExerciseId}:${r.setIndex}`)).toEqual([
      "be1:0",
      "be2:0",
      "be2:1",
    ]);
    expect(mockMarkSetPending).not.toHaveBeenCalled();
  });

  it("setManyDone(targets, false) unticks every done target and leaves not-done ones alone", async () => {
    const h = harness(structuredClone(baseSets));
    const { setManyDone } = makeSetDoneHandlers({
      session: makeSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await setManyDone(
      [
        { blockExerciseId: "be1", setIndex: 0 }, // already not-done — no-op
        { blockExerciseId: "be1", setIndex: 1 },
      ],
      false,
    );

    expect(h.state.be1.map((s) => s.done)).toEqual([false, false]);
    // Only the one set that was actually done gets a persistence call.
    expect(mockMarkSetPending).toHaveBeenCalledTimes(1);
    expect(mockUpsertSetLogs).not.toHaveBeenCalled();
  });

  it("setManyDone rolls a target back if persistence fails", async () => {
    mockUpsertSetLogs.mockRejectedValueOnce(new Error("network"));
    const h = harness(structuredClone(baseSets));
    const { setManyDone } = makeSetDoneHandlers({
      session: makeSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await setManyDone([{ blockExerciseId: "be2", setIndex: 0 }], true);

    expect(h.state.be2[0].done).toBe(false);
  });

  it("logs every measurement position of a set in one atomic request, reverting locally on failure", async () => {
    const session = {
      id: "s1",
      blocks: [
        {
          id: "b1",
          is_superset: false,
          exercises: [
            {
              id: "be1",
              exercise_id: "ex-be1",
              sets: 1,
              exercise: { id: "ex-be1", name: "be1" },
              measurements: [0, 1].map((position) => ({
                block_exercise_id: "be1",
                position,
                set_index: 0,
                unit_type: position === 0 ? "reps" : "kg",
                value: 10,
                value_entered_by: "coach",
                value_unit: null,
              })),
              setVariants: {},
              setStyles: {},
            },
          ],
        },
      ],
    } as never;

    mockUpsertSetLogs.mockRejectedValueOnce(new Error("network"));

    const h = harness({ be1: [{ done: false, values: { 0: 12, 1: 40 } }] });
    const { markSetDone } = makeSetDoneHandlers({
      session,
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await markSetDone("be1", 0);

    expect(mockUpsertSetLogs).toHaveBeenCalledTimes(1);
    expect(mockUpsertSetLogs).toHaveBeenCalledWith([
      expect.objectContaining({ position: 0, actualValue: 12 }),
      expect.objectContaining({ position: 1, actualValue: 40 }),
    ]);
    expect(h.state.be1[0].done).toBe(false);
    // The batch is all-or-nothing, so there's no half-written set to clean up.
    expect(mockMarkSetPending).not.toHaveBeenCalled();
  });

  it("untick-all only reverts the sets whose pending write failed", async () => {
    mockMarkSetPending
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));
    const h = harness({
      be1: [
        { done: true, values: { 0: 10 } },
        { done: true, values: { 0: 10 } },
      ],
      be2: structuredClone(baseSets.be2),
    });
    const { setManyDone } = makeSetDoneHandlers({
      session: makeSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await setManyDone(
      [
        { blockExerciseId: "be1", setIndex: 0 },
        { blockExerciseId: "be1", setIndex: 1 },
      ],
      false,
    );

    expect(h.state.be1.map((s) => s.done)).toEqual([false, true]);
  });
});

/** One plain block with a single placement "seq" whose 2 sets carry no
 * measurements — e.g. a sequence placed with the web builder's default of
 * no values to log. */
function makeNoMeasurementSession() {
  return {
    id: "s1",
    blocks: [
      {
        id: "b1",
        is_superset: false,
        exercises: [
          {
            id: "seq",
            exercise_id: null,
            sets: 2,
            exercise: { id: "seq", name: "Sequence" },
            measurements: [],
            setVariants: {},
            setStyles: {},
          },
        ],
      },
    ],
  } as never;
}

describe("sets with no measurements", () => {
  it("logs a single set-done marker row when ticked", async () => {
    const h = harness({
      seq: [
        { done: false, values: {} },
        { done: false, values: {} },
      ],
    });
    const { markSetDone } = makeSetDoneHandlers({
      session: makeNoMeasurementSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await markSetDone("seq", 1);

    expect(mockUpsertSetLogs).toHaveBeenCalledWith([
      expect.objectContaining({
        blockExerciseId: "seq",
        setIndex: 1,
        position: -1,
        unitType: "set_done",
        actualValue: null,
        status: "completed",
      }),
    ]);
  });

  it("reverts the marker to pending when unticked", async () => {
    const h = harness({
      seq: [
        { done: true, values: {} },
        { done: false, values: {} },
      ],
    });
    const { markSetDone } = makeSetDoneHandlers({
      session: makeNoMeasurementSession(),
      completion,
      athleteProfileId: "athlete-1",
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    await markSetDone("seq", 0);

    expect(mockMarkSetPending).toHaveBeenCalledWith(
      expect.objectContaining({ setIndex: 0, positions: [-1] }),
    );
  });

  it("reloads a set as done from its marker row (and not without one)", () => {
    const state = buildInitialSetsState(
      makeNoMeasurementSession(),
      [
        {
          block_exercise_id: "seq",
          set_index: 0,
          position: -1,
          status: "completed",
          actual_value: null,
        },
      ] as never,
      new Map(),
    );
    expect(state.seq.map((s) => s.done)).toEqual([true, false]);
  });
});
