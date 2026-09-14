import type { SetsByBlockExercise } from "@/src/hooks/useSessionPlayer";
import { makeFieldEditors } from "@/src/hooks/useSessionPlayer";

/** Minimal session shape: one plain block, one exercise "be1" with 3 sets,
 * each carrying one measurement at position 0. */
function makeSession() {
  const measurements = [0, 1, 2].map((set_index) => ({
    block_exercise_id: "be1",
    position: 0,
    set_index,
    unit_type: "reps",
    value: 12,
    value_entered_by: "coach",
    value_unit: null,
  }));
  return {
    id: "s1",
    blocks: [
      {
        id: "b1",
        is_superset: false,
        exercises: [
          {
            id: "be1",
            exercise_id: "ex1",
            sets: 3,
            exercise: { id: "ex1", name: "Squat" },
            measurements,
            setVariants: {},
            setStyles: {},
          },
        ],
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

const baseSets: SetsByBlockExercise = {
  be1: [
    { done: false, values: { 0: 12 } },
    { done: false, values: { 0: 12 } },
    { done: false, values: { 0: 12 } },
  ],
};

describe("makeFieldEditors", () => {
  it("setFieldValue updates just the one set", () => {
    const h = harness(structuredClone(baseSets));
    const { setFieldValue } = makeFieldEditors({
      session: makeSession(),
      completion: null,
      athleteProfileId: undefined,
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    setFieldValue("be1", 0, 0, 5);

    expect(h.state.be1.map((s) => s.values[0])).toEqual([5, 12, 12]);
  });

  it("applyValueForward writes the value onto every supplied later set", () => {
    const h = harness(structuredClone(baseSets));
    const { applyValueForward } = makeFieldEditors({
      session: makeSession(),
      completion: null,
      athleteProfileId: undefined,
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    // Editing set 0 -> also fill sets 1 and 2.
    applyValueForward("be1", 0, 5, [1, 2]);

    expect(h.state.be1.map((s) => s.values[0])).toEqual([12, 5, 5]);
  });

  it("applyValueForward is a no-op when there are no target sets", () => {
    const h = harness(structuredClone(baseSets));
    const { applyValueForward } = makeFieldEditors({
      session: makeSession(),
      completion: null,
      athleteProfileId: undefined,
      setsStateRef: h.ref as never,
      commitSetsState: h.commitSetsState,
    });

    applyValueForward("be1", 0, 5, []);

    expect(h.state.be1.map((s) => s.values[0])).toEqual([12, 12, 12]);
  });
});
