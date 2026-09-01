import {
  listAssignedPrograms,
  listProgramSessions,
} from "@/src/services/program.service";
import { initClient } from "@hooper/api";

const mockSupabase = { from: jest.fn() };
const mockFrom = mockSupabase.from;

beforeEach(() => {
  jest.clearAllMocks();
  initClient(mockSupabase as any);
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** `.select(...).eq(...)` */
function makeEqBuilder(resolveValue: unknown) {
  const eq = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

/** `.select(...).in(...)` */
function makeInBuilder(resolveValue: unknown) {
  const inFn = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ in: inFn });
  return { select };
}

/** `.select(...).in(...).eq(...).order(...)` (programs list) */
function makeProgramsListBuilder(resolveValue: unknown) {
  const order = jest.fn().mockResolvedValue(resolveValue);
  const eq = jest.fn().mockReturnValue({ order });
  const inFn = jest.fn().mockReturnValue({ eq });
  const select = jest.fn().mockReturnValue({ in: inFn });
  return { select };
}

/** `.select(...).eq(...).order(...).order(...)` (sessions list, ordered by week then position) */
function makeSessionsBuilder(resolveValue: unknown) {
  const order2 = jest.fn().mockResolvedValue(resolveValue);
  const order1 = jest.fn().mockReturnValue({ order: order2 });
  const eq = jest.fn().mockReturnValue({ order: order1 });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

/** `.select(...).eq(...).eq(...).in(...).order(...)` (completions, most-recent-first) */
function makeCompletionsBuilder(resolveValue: unknown) {
  const order = jest.fn().mockResolvedValue(resolveValue);
  const inFn = jest.fn().mockReturnValue({ order });
  const eq2 = jest.fn().mockReturnValue({ in: inFn });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

/** `.select(...).eq(...).eq(...).in(...)` (completions for listProgramSessions, unordered) */
function makeCompletionsNoOrderBuilder(resolveValue: unknown) {
  const inFn = jest.fn().mockResolvedValue(resolveValue);
  const eq2 = jest.fn().mockReturnValue({ in: inFn });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

/** `.select(...).eq(...).eq(...).in(...).order(...)` (active/in-progress lookup ordered by started_at, used by listProgramSessions) */
function makeActiveOrderedBuilder(resolveValue: unknown) {
  const order = jest.fn().mockResolvedValue(resolveValue);
  const inFn = jest.fn().mockReturnValue({ order });
  const eq2 = jest.fn().mockReturnValue({ in: inFn });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

/** `.select(...).eq(...).eq(...).in(...)` (active/in-progress lookup, used by buildProgramCard — just needs a count) */
const makeActiveCountBuilder = makeCompletionsNoOrderBuilder;

const noActiveSessions = { data: [], error: null };

// ─── listAssignedPrograms ───────────────────────────────────────────────────

describe("listAssignedPrograms", () => {
  it("unions directly-assigned and team-assigned program ids without duplicates", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeEqBuilder({ data: [{ program_id: "prog1" }], error: null }),
      ) // program_athletes
      .mockReturnValueOnce(
        makeEqBuilder({ data: [{ team_id: "team1" }], error: null }),
      ) // team_members
      .mockReturnValueOnce(
        makeInBuilder({ data: [{ program_id: "prog1" }], error: null }),
      ) // program_teams (same prog)
      .mockReturnValueOnce(
        makeProgramsListBuilder({
          data: [{ id: "prog1", name: "Base", status: "active" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(makeSessionsBuilder({ data: [], error: null })); // no sessions -> zeroed card

    const result = await listAssignedPrograms("athlete1");

    expect(result).toHaveLength(1);
    expect(result[0].program.id).toBe("prog1");
    expect(result[0].totalSessions).toBe(0);
  });

  it("returns an empty list without querying programs when nothing is assigned", async () => {
    mockFrom
      .mockReturnValueOnce(makeEqBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeEqBuilder({ data: [], error: null }));

    const result = await listAssignedPrograms("athlete1");

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("computes progress from completed sessions and picks the first incomplete as next", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeEqBuilder({ data: [{ program_id: "prog1" }], error: null }),
      )
      .mockReturnValueOnce(makeEqBuilder({ data: [], error: null })) // no teams
      .mockReturnValueOnce(
        makeProgramsListBuilder({
          data: [{ id: "prog1", name: "Base", status: "active" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0 },
            { id: "sess2", week_number: 1, position: 1 },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeCompletionsBuilder({
          data: [
            {
              session_id: "sess1",
              active_duration_seconds: 3120,
              completed_at: "2026-07-28T00:00:00Z",
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(makeActiveCountBuilder(noActiveSessions));

    const result = await listAssignedPrograms("athlete1");

    expect(result[0].completedSessions).toBe(1);
    expect(result[0].totalSessions).toBe(2);
    expect(result[0].nextSessionId).toBe("sess2");
    expect(result[0].lastSessionDurationSeconds).toBe(3120);
    expect(result[0].activeSessionCount).toBe(0);
  });

  it("counts in-progress sessions as active, separate from the positional next session", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeEqBuilder({ data: [{ program_id: "prog1" }], error: null }),
      )
      .mockReturnValueOnce(makeEqBuilder({ data: [], error: null })) // no teams
      .mockReturnValueOnce(
        makeProgramsListBuilder({
          data: [{ id: "prog1", name: "Base", status: "active" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0, name: "A" },
            { id: "sess2", week_number: 1, position: 1, name: "B" },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(makeCompletionsBuilder({ data: [], error: null }))
      .mockReturnValueOnce(
        makeActiveCountBuilder({
          data: [{ session_id: "sess2" }],
          error: null,
        }),
      );

    const result = await listAssignedPrograms("athlete1");

    expect(result[0].nextSessionId).toBe("sess1");
    expect(result[0].activeSessionCount).toBe(1);
  });

  it("counts more than one in-progress session (started one, left it, started another)", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeEqBuilder({ data: [{ program_id: "prog1" }], error: null }),
      )
      .mockReturnValueOnce(makeEqBuilder({ data: [], error: null })) // no teams
      .mockReturnValueOnce(
        makeProgramsListBuilder({
          data: [{ id: "prog1", name: "Base", status: "active" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0, name: "A" },
            { id: "sess2", week_number: 1, position: 1, name: "B" },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(makeCompletionsBuilder({ data: [], error: null }))
      .mockReturnValueOnce(
        makeActiveCountBuilder({
          data: [{ session_id: "sess1" }, { session_id: "sess2" }],
          error: null,
        }),
      );

    const result = await listAssignedPrograms("athlete1");

    expect(result[0].activeSessionCount).toBe(2);
  });
});

// ─── listProgramSessions ────────────────────────────────────────────────────

describe("listProgramSessions", () => {
  it("marks only the first not-yet-completed session as current", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            {
              id: "sess1",
              week_number: 1,
              position: 0,
              name: "A",
              blocks: [{ id: "b1" }],
            },
            { id: "sess2", week_number: 1, position: 1, name: "B", blocks: [] },
            { id: "sess3", week_number: 2, position: 0, name: "C", blocks: [] },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeCompletionsNoOrderBuilder({
          data: [{ session_id: "sess1", active_duration_seconds: 1800 }],
          error: null,
        }),
      )
      .mockReturnValueOnce(makeActiveOrderedBuilder(noActiveSessions));

    const result = await listProgramSessions("prog1", "athlete1");

    expect(result[0]).toMatchObject({
      id: "sess1",
      done: true,
      current: false,
      active: false,
      durationSeconds: 1800,
    });
    expect(result[1]).toMatchObject({
      id: "sess2",
      done: false,
      current: true,
      active: false,
    });
    expect(result[2]).toMatchObject({
      id: "sess3",
      done: false,
      current: false,
      active: false,
    });
  });

  it("makes the in-progress session current even when an earlier session is still incomplete", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0, name: "A", blocks: [] },
            { id: "sess2", week_number: 1, position: 1, name: "B", blocks: [] },
            { id: "sess3", week_number: 2, position: 0, name: "C", blocks: [] },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeCompletionsNoOrderBuilder({ data: [], error: null }),
      )
      .mockReturnValueOnce(
        makeActiveOrderedBuilder({
          data: [{ session_id: "sess3", started_at: "2026-08-27T00:00:00Z" }],
          error: null,
        }),
      );

    const result = await listProgramSessions("prog1", "athlete1");

    expect(result[0]).toMatchObject({
      id: "sess1",
      done: false,
      current: false,
      active: false,
    });
    expect(result[1]).toMatchObject({
      id: "sess2",
      done: false,
      current: false,
      active: false,
    });
    expect(result[2]).toMatchObject({
      id: "sess3",
      done: false,
      current: true,
      active: true,
      activeStartedAt: "2026-08-27T00:00:00Z",
    });
  });

  it("ignores a stale in-progress row on a session that is already completed", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0, name: "A", blocks: [] },
            { id: "sess2", week_number: 1, position: 1, name: "B", blocks: [] },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeCompletionsNoOrderBuilder({
          data: [{ session_id: "sess2", active_duration_seconds: 1800 }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeActiveOrderedBuilder({
          data: [{ session_id: "sess2", started_at: "2026-08-27T00:00:00Z" }],
          error: null,
        }),
      );

    const result = await listProgramSessions("prog1", "athlete1");

    // The completed session isn't re-flagged active/current by its abandoned
    // in-progress attempt...
    expect(result[1]).toMatchObject({
      id: "sess2",
      done: true,
      active: false,
      current: false,
    });
    // ...and current falls back to the first genuinely incomplete session.
    expect(result[0]).toMatchObject({
      id: "sess1",
      done: false,
      current: true,
    });
  });

  it("flags every in-progress session as active, but only the most recently started as current", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeSessionsBuilder({
          data: [
            { id: "sess1", week_number: 1, position: 0, name: "A", blocks: [] },
            { id: "sess2", week_number: 1, position: 1, name: "B", blocks: [] },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeCompletionsNoOrderBuilder({ data: [], error: null }),
      )
      .mockReturnValueOnce(
        makeActiveOrderedBuilder({
          // ordered most-recently-started first, per the .order("started_at", desc) call
          data: [
            { session_id: "sess2", started_at: "2026-08-27T10:00:00Z" },
            { session_id: "sess1", started_at: "2026-08-26T10:00:00Z" },
          ],
          error: null,
        }),
      );

    const result = await listProgramSessions("prog1", "athlete1");

    expect(result[0]).toMatchObject({
      id: "sess1",
      current: false,
      active: true,
      activeStartedAt: "2026-08-26T10:00:00Z",
    });
    expect(result[1]).toMatchObject({
      id: "sess2",
      current: true,
      active: true,
      activeStartedAt: "2026-08-27T10:00:00Z",
    });
  });
});
