import type {
  BlockExerciseMeasurementRow,
  BlockExerciseWithDetails,
  ExerciseStyleRow,
  SessionWithBlocks,
} from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  blockMetaLine,
  buildSetTableModel,
  formatMeasurementCell,
  groupSessionsByWeek,
  resolveExportWeeks,
  resolveStyleName,
  sessionsPerWeekLabel,
  supersetLetter,
  weekCoverageLabel,
} from "./programExport";

function measurement(
  set_index: number,
  position: number,
  unit_type: string,
  value: number | null,
  value_unit: string | null = null,
  value_entered_by: "coach" | "athlete" = "coach",
): BlockExerciseMeasurementRow {
  return {
    block_exercise_id: "be-1",
    position,
    set_index,
    unit_type,
    value,
    value_entered_by,
    value_unit,
    created_at: "",
    updated_at: "",
  };
}

function style(id: string, name: string): ExerciseStyleRow {
  return {
    id,
    name,
    description: null,
    position: 0,
    created_by: "c",
    created_at: "",
    updated_at: "",
  };
}

function blockExercise(
  overrides: Partial<BlockExerciseWithDetails> = {},
): BlockExerciseWithDetails {
  return {
    id: "be-1",
    block_id: "b-1",
    exercise_id: "ex-1",
    position: 0,
    sets: 3,
    notes: null,
    link_group_id: null,
    style_id: null,
    created_at: "",
    updated_at: "",
    exercise: {
      id: "ex-1",
      name: "Bench Press",
      description: null,
      video_url: null,
      video_source: null,
      video_orientation: null,
      video_thumbnail_url: null,
      parent_id: null,
      default_style_id: null,
      created_by: "c",
      created_at: "",
      updated_at: "",
      categories: [],
      unitTypes: ["Reps", "Weight"],
      unitTypeIds: [],
      defaultStyle: null,
      variants: [],
    },
    measurements: [],
    setVariants: {},
    setStyles: {},
    ...overrides,
  };
}

describe("formatMeasurementCell", () => {
  it("hugs the unit for Time/Distance/% 1RM, spaces it for Weight", () => {
    expect(formatMeasurementCell(measurement(0, 0, "Weight", 65, "kg"))).toBe(
      "65 kg",
    );
    expect(formatMeasurementCell(measurement(0, 0, "Distance", 20, "m"))).toBe(
      "20m",
    );
    expect(formatMeasurementCell(measurement(0, 0, "% 1RM", 75))).toBe("75%");
  });

  it("is a bare number when the unit type has no unit", () => {
    expect(formatMeasurementCell(measurement(0, 0, "Reps", 8))).toBe("8");
  });

  it("is an em dash for an athlete-entered or null value", () => {
    expect(formatMeasurementCell(measurement(0, 0, "Reps", null))).toBe("—");
    expect(
      formatMeasurementCell(measurement(0, 0, "Reps", 8, null, "athlete")),
    ).toBe("—");
  });
});

describe("buildSetTableModel", () => {
  it("one column per unit type any set uses, canonical order", () => {
    const be = blockExercise({
      sets: 2,
      measurements: [
        measurement(0, 0, "Weight", 60, "kg"),
        measurement(0, 1, "Reps", 5),
        measurement(1, 0, "Weight", 65, "kg"),
        measurement(1, 1, "Reps", 5),
      ],
    });
    const model = buildSetTableModel(be, []);
    expect(model.unitColumns).toEqual(["Reps", "Weight"]);
    expect(model.showStyleColumn).toBe(false);
    expect(model.rows).toHaveLength(2);
    expect(model.rows[1]!.values).toEqual({ Reps: "5", Weight: "65 kg" });
  });

  it("blank when a set doesn't use a column's measure, em dash when the athlete fills it", () => {
    const be = blockExercise({
      sets: 3,
      measurements: [
        measurement(0, 0, "Reps", 10), // coach value
        measurement(1, 0, "Reps", null, null, "athlete"), // athlete records it
        // set 2 has no Reps row at all
      ],
    });
    const model = buildSetTableModel(be, []);
    expect(model.rows[0]!.values).toEqual({ Reps: "10" });
    expect(model.rows[1]!.values).toEqual({ Reps: "—" });
    expect(model.rows[2]!.values).toEqual({ Reps: "" });
  });

  it("shows a style column and per-set names when set styles vary", () => {
    const warmup = style("s-wu", "Warmup");
    const working = style("s-wo", "Working");
    const be = blockExercise({
      sets: 3,
      style_id: "s-wo",
      setStyles: { 0: warmup },
      measurements: [
        measurement(0, 0, "Reps", 5),
        measurement(1, 0, "Reps", 5),
        measurement(2, 0, "Reps", 5),
      ],
    });
    const model = buildSetTableModel(be, [warmup, working]);
    expect(model.showStyleColumn).toBe(true);
    expect(model.rows.map((r) => r.styleName)).toEqual([
      "Warmup",
      "Working",
      "Working",
    ]);
  });

  it("no style column when every set resolves to the same style", () => {
    const working = style("s-wo", "Working");
    const be = blockExercise({
      sets: 2,
      style_id: "s-wo",
      measurements: [
        measurement(0, 0, "Reps", 5),
        measurement(1, 0, "Reps", 5),
      ],
    });
    const model = buildSetTableModel(be, [working]);
    expect(model.showStyleColumn).toBe(false);
  });
});

describe("resolveStyleName", () => {
  it("is the most common set style's full name", () => {
    const warmup = style("s-wu", "Warmup");
    const working = style("s-wo", "Working");
    const be = blockExercise({
      sets: 4,
      style_id: "s-wo",
      setStyles: { 0: warmup },
    });
    expect(resolveStyleName(be, [warmup, working])).toBe("Working");
  });

  it("is null when no set carries a style", () => {
    expect(resolveStyleName(blockExercise({ sets: 3 }), [])).toBeNull();
  });
});

describe("blockMetaLine", () => {
  it("counts exercises for a normal block", () => {
    expect(blockMetaLine(false, null, 2)).toBe("2 exercises");
    expect(blockMetaLine(false, null, 1)).toBe("1 exercise");
  });

  it("describes superset rounds and the letter range", () => {
    expect(blockMetaLine(true, 3, 2)).toBe(
      "3 rounds · complete A–B back to back",
    );
    expect(blockMetaLine(true, 1, 3)).toBe(
      "1 round · complete A–C back to back",
    );
  });

  it("falls back to 1 round when a superset has no round count", () => {
    expect(blockMetaLine(true, null, 2)).toBe(
      "1 round · complete A–B back to back",
    );
  });
});

describe("supersetLetter", () => {
  it("maps index to A, B, C", () => {
    expect([0, 1, 2].map(supersetLetter)).toEqual(["A", "B", "C"]);
  });
});

function session(
  id: string,
  week_number: number,
  position: number,
): SessionWithBlocks {
  return {
    id,
    program_id: "p-1",
    week_number,
    name: `Session ${position + 1}`,
    position,
    link_group_id: null,
    created_at: "",
    updated_at: "",
    blocks: [],
  };
}

describe("groupSessionsByWeek", () => {
  it("represents exactly the given weeks, ascending, sessions by position", () => {
    const groups = groupSessionsByWeek(
      [session("b", 1, 1), session("a", 1, 0), session("c", 3, 0)],
      [3, 1, 2],
    );
    expect(groups.map((g) => g.weekNumber)).toEqual([1, 2, 3]);
    expect(groups[0]!.sessions.map((s) => s.id)).toEqual(["a", "b"]);
    expect(groups[1]!.sessions).toEqual([]);
  });

  it("omits weeks that aren't in the list", () => {
    const groups = groupSessionsByWeek(
      [session("a", 1, 0), session("c", 3, 0)],
      [3],
    );
    expect(groups.map((g) => g.weekNumber)).toEqual([3]);
    expect(groups[0]!.sessions.map((s) => s.id)).toEqual(["c"]);
  });
});

describe("resolveExportWeeks", () => {
  it("defaults to the whole program when nothing valid is given", () => {
    expect(resolveExportWeeks(null, 3)).toEqual([1, 2, 3]);
    expect(resolveExportWeeks([], 3)).toEqual([1, 2, 3]);
    expect(resolveExportWeeks([0, 9, 4.5], 3)).toEqual([1, 2, 3]);
  });

  it("keeps only in-range integers, sorted and de-duped", () => {
    expect(resolveExportWeeks([3, 1, 1, 5, 2], 4)).toEqual([1, 2, 3]);
  });
});

describe("weekCoverageLabel", () => {
  it("is empty for the whole program", () => {
    expect(weekCoverageLabel([1, 2, 3], 3)).toBe("");
  });

  it("names a single week, a contiguous run, or a loose count", () => {
    expect(weekCoverageLabel([4], 12)).toBe("Week 4 of 12");
    expect(weekCoverageLabel([3, 4, 5], 12)).toBe("Weeks 3–5 of 12");
    expect(weekCoverageLabel([2, 5, 9], 12)).toBe("3 of 12 weeks");
  });
});

describe("sessionsPerWeekLabel", () => {
  it("is a single count when every week matches", () => {
    expect(sessionsPerWeekLabel([session("a", 1, 0), session("b", 2, 0)])).toBe(
      "1 / week",
    );
  });

  it("is a range when weeks differ", () => {
    expect(
      sessionsPerWeekLabel([
        session("a", 1, 0),
        session("b", 1, 1),
        session("c", 2, 0),
      ]),
    ).toBe("1–2 / week");
  });
});
