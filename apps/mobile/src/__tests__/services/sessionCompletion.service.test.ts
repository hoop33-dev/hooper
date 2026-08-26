import {
  completeSession,
  pauseSession,
  resumeSession,
  startOrResumeSession,
} from "@/src/services/sessionCompletion.service";
import { initClient } from "@hooper/api";

const mockSupabase = { from: jest.fn() };
const mockFrom = mockSupabase.from;

beforeEach(() => {
  jest.clearAllMocks();
  initClient(mockSupabase as any);
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** `.select(...).eq(...).eq(...).eq(...).maybeSingle()` */
function makeInProgressLookupBuilder(resolveValue: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue(resolveValue);
  const eq3 = jest.fn().mockReturnValue({ maybeSingle });
  const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

/** `.insert(...).select().single()` */
function makeInsertSingleBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  return { insert };
}

/** `.select(...).eq(...).single()` */
function makeSingleEqBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

/** `.update(...).eq(...).select().single()` */
function makeUpdateSingleBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const update = jest.fn().mockReturnValue({ eq });
  return { update };
}

// ─── startOrResumeSession ─────────────────────────────────────────────────

describe("startOrResumeSession", () => {
  it("returns the existing in-progress row without inserting", async () => {
    const existing = { id: "sc1", status: "in_progress" };
    mockFrom.mockReturnValue(
      makeInProgressLookupBuilder({ data: existing, error: null }),
    );

    const result = await startOrResumeSession("s1", "p1");

    expect(result).toBe(existing);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("creates a new row with today's local date when none is in progress", async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 29, 10, 0, 0));
    const created = { id: "sc2", status: "in_progress" };
    const insertBuilder = makeInsertSingleBuilder({
      data: created,
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(
        makeInProgressLookupBuilder({ data: null, error: null }),
      )
      .mockReturnValueOnce(insertBuilder);

    const result = await startOrResumeSession("s1", "p1");

    expect(result).toBe(created);
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "s1",
        athlete_profile_id: "p1",
        session_date: "2026-07-29",
      }),
    );
  });
});

// ─── resumeSession ─────────────────────────────────────────────────────────

describe("resumeSession", () => {
  it("folds the elapsed pause into paused_duration_seconds and clears paused_at", async () => {
    const now = new Date(2026, 6, 29, 10, 5, 0);
    jest.useFakeTimers().setSystemTime(now);
    const pausedAt = new Date(now.getTime() - 30_000).toISOString(); // paused 30s ago

    const updateBuilder = makeUpdateSingleBuilder({
      data: { id: "sc1", paused_at: null, paused_duration_seconds: 90 },
      error: null,
    });
    mockFrom.mockReturnValue(updateBuilder);

    const result = await resumeSession("sc1", pausedAt, 60);

    expect(updateBuilder.update).toHaveBeenCalledWith({
      paused_at: null,
      paused_duration_seconds: 90, // 60 + 30
    });
    expect(result.paused_duration_seconds).toBe(90);
    // Single round trip — no lookup select before the update.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

// ─── pauseSession ──────────────────────────────────────────────────────────

describe("pauseSession", () => {
  it("stamps paused_at on the row", async () => {
    const updateBuilder = makeUpdateSingleBuilder({
      data: { id: "sc1" },
      error: null,
    });
    mockFrom.mockReturnValue(updateBuilder);

    await pauseSession("sc1");

    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ paused_at: expect.any(String) }),
    );
  });
});

// ─── completeSession ───────────────────────────────────────────────────────

describe("completeSession", () => {
  it("computes active duration as elapsed time minus paused time", async () => {
    const started = new Date(2026, 6, 29, 10, 0, 0);
    const now = new Date(2026, 6, 29, 10, 10, 0); // 10 minutes later
    jest.useFakeTimers().setSystemTime(now);

    const lookupBuilder = makeSingleEqBuilder({
      data: {
        started_at: started.toISOString(),
        paused_at: null,
        paused_duration_seconds: 120,
      },
      error: null,
    });
    const updateBuilder = makeUpdateSingleBuilder({
      data: { id: "sc1" },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(updateBuilder);

    await completeSession("sc1", 7);

    // 600s elapsed - 120s paused = 480s active.
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        paused_duration_seconds: 120,
        active_duration_seconds: 480,
        effort_rpe: 7,
      }),
    );
  });

  it("folds in a still-open pause defensively", async () => {
    const started = new Date(2026, 6, 29, 10, 0, 0);
    const now = new Date(2026, 6, 29, 10, 10, 0);
    jest.useFakeTimers().setSystemTime(now);
    const pausedAt = new Date(now.getTime() - 60_000).toISOString(); // paused 60s ago, never resumed

    const lookupBuilder = makeSingleEqBuilder({
      data: {
        started_at: started.toISOString(),
        paused_at: pausedAt,
        paused_duration_seconds: 0,
      },
      error: null,
    });
    const updateBuilder = makeUpdateSingleBuilder({
      data: { id: "sc1" },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(updateBuilder);

    await completeSession("sc1", 5);

    // 600s elapsed - 60s trailing pause = 540s active.
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paused_duration_seconds: 60,
        active_duration_seconds: 540,
      }),
    );
  });
});
