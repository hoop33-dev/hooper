import {
  formatPrescription,
  sessionTotals,
} from "@/src/lib/measurementSummary";
import type {
  AthleteBlockExercise,
  AthleteExercise,
  AthleteSessionDetail,
} from "@hooper/api";
import type { BlockExerciseMeasurementRow } from "@hooper/db";

function makeExercise(id: string): AthleteExercise {
  return {
    id,
    name: id,
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
    photos: [],
  };
}

function m(
  set_index: number,
  unit_type: string,
  value: number | null,
  value_unit: string | null = null,
): BlockExerciseMeasurementRow {
  return {
    block_exercise_id: "be-1",
    position: 0,
    set_index,
    unit_type,
    value,
    value_entered_by: value == null ? "athlete" : "coach",
    value_unit,
    created_at: "",
    updated_at: "",
  };
}

/** Every set gets the same value for each [unit_type, value, unit] slot. */
function uniform(
  sets: number,
  slots: [string, number | null, string?][],
): BlockExerciseMeasurementRow[] {
  return Array.from({ length: sets }, (_, i) =>
    slots.map(([type, value, unit]) => m(i, type, value, unit ?? null)),
  ).flat();
}

function makeBlockExercise(
  overrides: Partial<AthleteBlockExercise> = {},
): AthleteBlockExercise {
  return {
    id: "be-1",
    block_id: "block-1",
    exercise_id: "ex-1",
    position: 0,
    sets: 4,
    notes: null,
    link_group_id: null,
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise: makeExercise("ex-1"),
    measurements: [],
    style: null,
    setVariants: {},
    setStyles: {},
    ...overrides,
  };
}

const ALL4 = [0, 1, 2, 3];

describe("formatPrescription", () => {
  it("is sets × first slot, then the rest comma-separated", () => {
    const be = makeBlockExercise({
      // Out of priority order on purpose — Reps must still lead.
      measurements: uniform(4, [
        ["Weight", 32],
        ["Reps", 8],
      ]),
    });
    expect(formatPrescription(be, ALL4, false)).toBe("4 × 8, 32 kg");
  });

  it("hugs time/distance units and respects an explicit unit", () => {
    const be = makeBlockExercise({
      sets: 3,
      measurements: uniform(3, [
        ["Time", 20],
        ["Distance", 1, "km"],
      ]),
    });
    expect(formatPrescription(be, [0, 1, 2], false)).toBe("3 × 20sec, 1km");
  });

  it("renders a pyramid as a first→last range", () => {
    const be = makeBlockExercise({
      sets: 2,
      measurements: [m(0, "Reps", 12), m(1, "Reps", 6)],
    });
    expect(formatPrescription(be, [0, 1], false)).toBe("2 × 12→6");
  });

  it("dashes athlete-entered values and shows per-side reps", () => {
    const be = makeBlockExercise({
      measurements: uniform(4, [
        ["Reps Each Side", 10],
        ["Weight", null],
      ]),
    });
    expect(formatPrescription(be, ALL4, false)).toBe("4 × 10/side, —");
  });

  it("drops the set count in a superset and labels reps", () => {
    const be = makeBlockExercise({
      measurements: uniform(4, [
        ["Reps", 8],
        ["Weight", 20],
      ]),
    });
    expect(formatPrescription(be, ALL4, true)).toBe("8 reps, 20 kg");
  });

  it("falls back to a set count with no measurements, null in a superset", () => {
    const be = makeBlockExercise({ sets: 1 });
    expect(formatPrescription(be, [0], false)).toBe("1 set");
    expect(formatPrescription(be, [0], true)).toBeNull();
  });

  it("calls out mixed unit combos", () => {
    const be = makeBlockExercise({
      sets: 2,
      measurements: [m(0, "Reps", 8), m(1, "Time", 30)],
    });
    expect(formatPrescription(be, [0, 1], false)).toBe("2 sets, mixed units");
  });

  it("only considers the given sets", () => {
    const be = makeBlockExercise({
      measurements: [
        ...uniform(2, [["Reps", 8]]),
        m(2, "Reps", 5),
        m(3, "Reps", 5),
      ],
    });
    expect(formatPrescription(be, [2, 3], false)).toBe("2 × 5");
  });
});

describe("sessionTotals", () => {
  it("counts blocks, variant groups and sets", () => {
    const variant = makeExercise("ex-2");
    const session = {
      blocks: [
        { exercises: [makeBlockExercise({ sets: 3 })] },
        {
          exercises: [
            makeBlockExercise({
              sets: 4,
              setVariants: { 2: variant, 3: variant },
            }),
            makeBlockExercise({ sets: 2 }),
          ],
        },
      ],
    } as unknown as AthleteSessionDetail;
    expect(sessionTotals(session)).toEqual({
      blocks: 2,
      exercises: 4,
      sets: 9,
    });
  });
});
