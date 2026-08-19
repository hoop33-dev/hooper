import {
  buildPrefillMap,
  markSetPending,
  prefillKey,
  upsertSetLog,
} from "@/src/services/measurementLog.service";
import type { AthleteSessionDetail } from "@/src/services/program.service";
import { initClient } from "@hooper/api";

const mockSupabase = { from: jest.fn() };
const mockFrom = mockSupabase.from;

beforeEach(() => {
  jest.clearAllMocks();
  initClient(mockSupabase as any);
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** `.upsert(...).select().single()` */
function makeUpsertSingleBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ single });
  const upsert = jest.fn().mockReturnValue({ select });
  return { upsert };
}

/** `.update(...).eq(...).eq(...).eq(...).in(...)` */
function makeUpdateBuilder(resolveValue: unknown) {
  const inFn = jest.fn().mockResolvedValue(resolveValue);
  const eq3 = jest.fn().mockReturnValue({ in: inFn });
  const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const update = jest.fn().mockReturnValue({ eq: eq1 });
  return { update };
}

/** `.select(...).eq(...).eq(...).eq(...).eq(...).not(...).order(...).limit(...).maybeSingle()` */
function makeLastValueBuilder(resolveValue: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue(resolveValue);
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const order = jest.fn().mockReturnValue({ limit });
  const not = jest.fn().mockReturnValue({ order });
  const eq4 = jest.fn().mockReturnValue({ not });
  const eq3 = jest.fn().mockReturnValue({ eq: eq4 });
  const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

function session(
  measurements: {
    exerciseId: string;
    position: number;
    unitType: string;
    value: number | null;
    valueEnteredBy: "coach" | "athlete";
  }[],
): AthleteSessionDetail {
  return {
    id: "s1",
    program_id: "p1",
    week_number: 1,
    name: "Session",
    position: 0,
    link_group_id: null,
    created_at: "",
    updated_at: "",
    blocks: [
      {
        id: "b1",
        session_id: "s1",
        name: "Block",
        color: "#fff",
        position: 0,
        link_group_id: null,
        is_superset: false,
        sets: null,
        created_at: "",
        updated_at: "",
        exercises: measurements.map((m, i) => ({
          id: `be${i}`,
          block_id: "b1",
          exercise_id: m.exerciseId,
          position: i,
          sets: 1,
          notes: null,
          link_group_id: null,
          style_id: null,
          created_at: "",
          updated_at: "",
          exercise: {
            id: m.exerciseId,
            name: `Exercise ${i}`,
            description: null,
            video_url: null,
            video_source: null,
            parent_id: null,
            default_style_id: null,
            created_by: "coach",
            created_at: "",
            updated_at: "",
          },
          style: null,
          setVariants: {},
          setStyles: {},
          measurements: [
            {
              block_exercise_id: `be${i}`,
              position: 0,
              set_index: 0,
              unit_type: m.unitType,
              value: m.value,
              value_entered_by: m.valueEnteredBy,
              value_unit: null,
              created_at: "",
              updated_at: "",
            },
          ],
        })),
      },
    ],
  };
}

// ─── upsertSetLog ───────────────────────────────────────────────────────────

describe("upsertSetLog", () => {
  it("upserts on the (session_completion, block_exercise, position, set_index) grain", async () => {
    const builder = makeUpsertSingleBuilder({
      data: { id: "log1" },
      error: null,
    });
    mockFrom.mockReturnValue(builder);

    await upsertSetLog({
      sessionCompletionId: "sc1",
      blockExerciseId: "be1",
      position: 0,
      setIndex: 2,
      athleteProfileId: "p1",
      exerciseId: "ex1",
      unitType: "kg",
      plannedValue: 40,
      actualValue: 42,
    });

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_completion_id: "sc1",
        block_exercise_id: "be1",
        position: 0,
        set_index: 2,
        actual_value: 42,
        status: "completed",
      }),
      {
        onConflict:
          "session_completion_id,block_exercise_id,position,set_index",
      },
    );
  });
});

// ─── markSetPending ─────────────────────────────────────────────────────────

describe("markSetPending", () => {
  it("reverts every measurement position for the set back to pending", async () => {
    const builder = makeUpdateBuilder({ error: null });
    mockFrom.mockReturnValue(builder);

    await markSetPending({
      sessionCompletionId: "sc1",
      blockExerciseId: "be1",
      setIndex: 2,
      positions: [0, 1],
    });

    expect(builder.update).toHaveBeenCalledWith({ status: "pending" });
  });
});

// ─── buildPrefillMap ────────────────────────────────────────────────────────

describe("buildPrefillMap", () => {
  it("skips measurements the coach specified a value for", async () => {
    const s = session([
      {
        exerciseId: "ex1",
        position: 0,
        unitType: "kg",
        value: 40,
        valueEnteredBy: "coach",
      },
    ]);

    const result = await buildPrefillMap("p1", s);

    expect(result.size).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("skips athlete-entered measurements that already have a value", async () => {
    const s = session([
      {
        exerciseId: "ex1",
        position: 0,
        unitType: "kg",
        value: 20,
        valueEnteredBy: "athlete",
      },
    ]);

    const result = await buildPrefillMap("p1", s);

    expect(result.size).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("looks up history only for genuinely blank athlete-entered measurements", async () => {
    const s = session([
      {
        exerciseId: "ex1",
        position: 0,
        unitType: "kg",
        value: null,
        valueEnteredBy: "athlete",
      },
    ]);
    mockFrom.mockReturnValue(
      makeLastValueBuilder({ data: { actual_value: 55 }, error: null }),
    );

    const result = await buildPrefillMap("p1", s);

    expect(result.get(prefillKey("ex1", "kg"))).toBe(55);
  });

  it("omits an entry when there's no prior logged value", async () => {
    const s = session([
      {
        exerciseId: "ex1",
        position: 0,
        unitType: "kg",
        value: null,
        valueEnteredBy: "athlete",
      },
    ]);
    mockFrom.mockReturnValue(makeLastValueBuilder({ data: null, error: null }));

    const result = await buildPrefillMap("p1", s);

    expect(result.has(prefillKey("ex1", "kg"))).toBe(false);
  });
});
