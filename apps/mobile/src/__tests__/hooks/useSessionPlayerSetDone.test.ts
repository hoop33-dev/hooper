import type { SetsByBlockExercise } from "@/src/hooks/useSessionPlayer";
import { makeSetDoneHandlers } from "@/src/hooks/useSessionPlayer";

const mockUpsertSetLog = jest.fn().mockResolvedValue({});
const mockMarkSetPending = jest.fn().mockResolvedValue(undefined);

jest.mock("@/src/services/measurementLog.service", () => ({
  upsertSetLog: (...args: unknown[]) => mockUpsertSetLog(...args),
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
  mockUpsertSetLog.mockClear();
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
    // Only the three sets that weren't already done get persisted.
    expect(mockUpsertSetLog).toHaveBeenCalledTimes(3);
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
    expect(mockUpsertSetLog).not.toHaveBeenCalled();
  });

  it("setManyDone rolls a target back if persistence fails", async () => {
    mockUpsertSetLog.mockRejectedValueOnce(new Error("network"));
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
});
