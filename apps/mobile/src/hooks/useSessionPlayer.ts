import type {
  GroupSetTarget,
  SetRowState,
} from "@/src/components/training/ExerciseSetsCard";
import {
  loggedExerciseId,
  resolveSetExercise,
} from "@/src/lib/blockExerciseDisplay";
import {
  cacheSessionDetail,
  getCachedSessionDetail,
} from "@/src/lib/sessionDetailCache";
import {
  buildPrefillMap,
  getLogsForCompletion,
  markSetPending,
  prefillKey,
  SET_DONE_MARKER_POSITION,
  SET_DONE_MARKER_UNIT,
  upsertSetLogs,
  type UpsertSetLogInput,
} from "@/src/services/measurementLog.service";
import {
  getSessionDetail,
  type AthleteBlock,
  type AthleteBlockExercise,
  type AthleteSessionDetail,
} from "@/src/services/program.service";
import {
  pauseSession,
  resumeSession,
  startOrResumeSession,
} from "@/src/services/sessionCompletion.service";
import type {
  AthleteMeasurementLogRow,
  SessionCompletionRow,
} from "@hooper/db";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

export type SetsByBlockExercise = Record<string, SetRowState[]>;

type SetsStateUpdater =
  | SetsByBlockExercise
  | ((prev: SetsByBlockExercise) => SetsByBlockExercise);

/** State whose latest value is also readable synchronously via the returned
 * ref. `commit` writes the ref first, then the React state — so an async
 * callback (a set-done tap) can see a change another handler made in the same
 * gesture (a field edit committed on that tap's blur) without depending on
 * when React flushes. */
function useRefBackedSetsState() {
  const [state, setState] = useState<SetsByBlockExercise>({});
  const ref = useRef<SetsByBlockExercise>(state);
  const commit = useCallback((next: SetsStateUpdater) => {
    const resolved = typeof next === "function" ? next(ref.current) : next;
    ref.current = resolved;
    setState(resolved);
  }, []);
  return [state, ref, commit] as const;
}

function buildExerciseSets(
  be: AthleteBlockExercise,
  beLogs: AthleteMeasurementLogRow[],
  prefill: Map<string, number>,
): SetRowState[] {
  const rows: SetRowState[] = [];
  for (let setIndex = 0; setIndex < be.sets; setIndex++) {
    const setMeasurements = be.measurements.filter(
      (m) => m.set_index === setIndex,
    );
    // Done only if EVERY measurement position for this set has a completed
    // log row. A partially-persisted set (one position's upsert succeeded,
    // another failed on a flaky connection) must not reload as "done" with
    // the missing field silently defaulted to a prefill value.
    const isCompletedAt = (position: number) =>
      beLogs.some(
        (l) =>
          l.set_index === setIndex &&
          l.position === position &&
          l.status === "completed",
      );
    // A set with no measurements persists "done" as a single marker row
    // (see SET_DONE_MARKER_POSITION) — there's nothing else to check.
    const done =
      setMeasurements.length > 0
        ? setMeasurements.every((m) => isCompletedAt(m.position))
        : isCompletedAt(SET_DONE_MARKER_POSITION);
    const values: Record<number, number> = {};
    for (const m of setMeasurements) {
      const existing = beLogs.find(
        (l) => l.set_index === setIndex && l.position === m.position,
      );
      if (existing?.actual_value != null) {
        values[m.position] = existing.actual_value;
      } else if (m.value_entered_by === "athlete" && m.value === null) {
        const setExerciseId = resolveSetExercise(be, setIndex).id;
        values[m.position] =
          prefill.get(prefillKey(setExerciseId, m.unit_type)) ?? 0;
      } else {
        values[m.position] = m.value ?? 0;
      }
    }
    rows.push({ done, values });
  }
  return rows;
}

/** Rebuilds every set's done flag + values from the attempt's logged rows
 * (resume). Exported for tests. */
export function buildInitialSetsState(
  session: AthleteSessionDetail,
  logs: AthleteMeasurementLogRow[],
  prefill: Map<string, number>,
): SetsByBlockExercise {
  const logsByBlockExercise = new Map<string, AthleteMeasurementLogRow[]>();
  for (const log of logs) {
    const list = logsByBlockExercise.get(log.block_exercise_id) ?? [];
    list.push(log);
    logsByBlockExercise.set(log.block_exercise_id, list);
  }
  const result: SetsByBlockExercise = {};
  for (const block of session.blocks) {
    for (const be of block.exercises) {
      result[be.id] = buildExerciseSets(
        be,
        logsByBlockExercise.get(be.id) ?? [],
        prefill,
      );
    }
  }
  return result;
}

export function isBlockDone(
  block: AthleteBlock,
  setsState: SetsByBlockExercise,
): boolean {
  return block.exercises.every((be) =>
    (setsState[be.id] ?? []).every((s) => s.done),
  );
}

async function loadSessionDetail(sessionId: string) {
  const cached = getCachedSessionDetail(sessionId);
  if (cached) return cached;
  const session = await getSessionDetail(sessionId);
  cacheSessionDetail(session);
  return session;
}

async function loadSessionPlayerData(
  sessionId: string,
  athleteProfileId: string,
) {
  // Each fetch starts as soon as its own input is ready, rather than in two
  // sequential rounds: the logs only wait on the completion, the prefill
  // only on the session tree (usually already cached by the preview).
  const sessionP = loadSessionDetail(sessionId);
  const completionP = startOrResumeSession(sessionId, athleteProfileId);
  const logsP = (async () => getLogsForCompletion((await completionP).id))();
  const prefillP = (async () =>
    buildPrefillMap(athleteProfileId, await sessionP))();
  const [completion, session, logs, prefill] = await Promise.all([
    completionP,
    sessionP,
    logsP,
    prefillP,
  ]);
  const setsState = buildInitialSetsState(session, logs, prefill);
  const firstIncomplete = session.blocks.findIndex(
    (b) => !isBlockDone(b, setsState),
  );
  const blockIdx =
    firstIncomplete === -1
      ? Math.max(0, session.blocks.length - 1)
      : firstIncomplete;
  return { completion, session, setsState, blockIdx };
}

function applyFieldValue(
  setsState: SetsByBlockExercise,
  blockExerciseId: string,
  setIndex: number,
  position: number,
  value: number,
): SetsByBlockExercise {
  const rows = [...(setsState[blockExerciseId] ?? [])];
  const row = rows[setIndex];
  if (!row) return setsState;
  rows[setIndex] = {
    ...row,
    values: { ...row.values, [position]: value },
  };
  return { ...setsState, [blockExerciseId]: rows };
}

function findBlockExercise(
  session: AthleteSessionDetail,
  id: string,
): AthleteBlockExercise | undefined {
  return session.blocks.flatMap((b) => b.exercises).find((e) => e.id === id);
}

function markRowDone(
  setsState: SetsByBlockExercise,
  blockExerciseId: string,
  setIndex: number,
  done: boolean,
): SetsByBlockExercise {
  const rows = [...(setsState[blockExerciseId] ?? [])];
  rows[setIndex] = { ...rows[setIndex], done };
  return { ...setsState, [blockExerciseId]: rows };
}

async function persistSetPending(params: {
  completion: SessionCompletionRow;
  be: AthleteBlockExercise;
  setIndex: number;
}) {
  const { completion, be, setIndex } = params;
  const positions = setLogPositions(be, setIndex);
  await markSetPending({
    sessionCompletionId: completion.id,
    blockExerciseId: be.id,
    setIndex,
    positions,
  });
}

type SetWrite = {
  completion: SessionCompletionRow;
  athleteProfileId: string;
  be: AthleteBlockExercise;
  setIndex: number;
  row: SetRowState;
};

/** The log positions a set's done state lives at: its measurements', or
 * the single set-done marker when it has none. */
function setLogPositions(be: AthleteBlockExercise, setIndex: number) {
  const positions = be.measurements
    .filter((m) => m.set_index === setIndex)
    .map((m) => m.position);
  return positions.length ? positions : [SET_DONE_MARKER_POSITION];
}

/** One "completed" log row per measurement position of the set — or, for a
 * set with no measurements, one marker row, so its done state survives a
 * reload instead of nothing being written at all. */
function setDoneLogInputs(params: SetWrite): UpsertSetLogInput[] {
  const { completion, athleteProfileId, be, setIndex, row } = params;
  const exerciseId = loggedExerciseId(be, setIndex);
  const measurements = be.measurements.filter((m) => m.set_index === setIndex);
  if (measurements.length === 0) {
    return [
      {
        sessionCompletionId: completion.id,
        blockExerciseId: be.id,
        position: SET_DONE_MARKER_POSITION,
        setIndex,
        athleteProfileId,
        exerciseId,
        unitType: SET_DONE_MARKER_UNIT,
        plannedValue: null,
        actualValue: null,
        status: "completed",
      },
    ];
  }
  return measurements.map((m) => ({
    sessionCompletionId: completion.id,
    blockExerciseId: be.id,
    position: m.position,
    setIndex,
    athleteProfileId,
    exerciseId,
    unitType: m.unit_type,
    plannedValue: m.value,
    actualValue: row.values[m.position] ?? null,
    status: "completed" as const,
  }));
}

/** Logs every position of the set in one batched upsert — a single request
 * that lands all-or-nothing, so a flaky connection can't leave the set
 * half-persisted. */
async function persistSetDone(params: SetWrite) {
  await upsertSetLogs(setDoneLogInputs(params));
}

/** Writes a single measurement value straight through, keeping its
 * "completed" status — used when the athlete edits a value on a set they've
 * already ticked (item: editable completed sets) or fills a value forward
 * onto a later set that's already done. Optimistic: reverts just this cell to
 * `prevValue` if the write fails. A pending set needs none of this — its
 * value rides along when the set is ticked. */
async function persistFieldEdit(params: {
  completion: SessionCompletionRow;
  athleteProfileId: string;
  be: AthleteBlockExercise;
  blockExerciseId: string;
  setIndex: number;
  position: number;
  value: number;
  prevValue: number | undefined;
  commitSetsState: (next: SetsStateUpdater) => void;
}) {
  const { be, setIndex, position } = params;
  const measurement = be.measurements.find(
    (m) => m.set_index === setIndex && m.position === position,
  );
  if (!measurement) return;
  try {
    await upsertSetLogs([
      {
        sessionCompletionId: params.completion.id,
        blockExerciseId: params.blockExerciseId,
        position,
        setIndex,
        athleteProfileId: params.athleteProfileId,
        exerciseId: loggedExerciseId(be, setIndex),
        unitType: measurement.unit_type,
        plannedValue: measurement.value,
        actualValue: params.value,
        status: "completed",
      },
    ]);
  } catch {
    params.commitSetsState((prev) =>
      applyFieldValue(
        prev,
        params.blockExerciseId,
        setIndex,
        position,
        params.prevValue ?? 0,
      ),
    );
  }
}

/** Writes one measurement value into local state for `setIndex`, and — when
 * that row is already ticked done — persists it straight away so a completed
 * set stays editable in place. A pending row needs no write here; its value
 * rides along when the set is ticked. Shared by the single-field edit and the
 * "apply to later sets" action. */
function writeFieldValue(params: {
  completion: SessionCompletionRow | null;
  athleteProfileId: string | undefined;
  be: AthleteBlockExercise;
  blockExerciseId: string;
  setIndex: number;
  position: number;
  value: number;
  setsStateRef: MutableRefObject<SetsByBlockExercise>;
  commitSetsState: (next: SetsStateUpdater) => void;
}) {
  const {
    completion,
    athleteProfileId,
    be,
    blockExerciseId,
    setIndex,
    position,
    value,
  } = params;
  const prevValue =
    params.setsStateRef.current[blockExerciseId]?.[setIndex]?.values[position];
  params.commitSetsState((prev) =>
    applyFieldValue(prev, blockExerciseId, setIndex, position, value),
  );
  const row = params.setsStateRef.current[blockExerciseId]?.[setIndex];
  if (row?.done && completion && athleteProfileId) {
    void persistFieldEdit({
      completion,
      athleteProfileId,
      be,
      blockExerciseId,
      setIndex,
      position,
      value,
      prevValue,
      commitSetsState: params.commitSetsState,
    });
  }
}

type FieldEditDeps = {
  session: AthleteSessionDetail | null;
  completion: SessionCompletionRow | null;
  athleteProfileId: string | undefined;
  setsStateRef: MutableRefObject<SetsByBlockExercise>;
  commitSetsState: (next: SetsStateUpdater) => void;
};

/** The `setFieldValue` / `applyValueForward` callbacks the player passes down
 * to each value box. `setFieldValue` writes one set (persisting it if already
 * done); `applyValueForward` writes the same value onto the caller-supplied
 * later sets too — the component owns the "which sets" decision since it's
 * the one already grouping sets by variant for rendering. Exported for tests. */
export function makeFieldEditors(deps: FieldEditDeps) {
  const write = (
    blockExerciseId: string,
    setIndices: number[],
    position: number,
    value: number,
  ) => {
    const be = deps.session && findBlockExercise(deps.session, blockExerciseId);
    if (!be) return;
    for (const setIndex of setIndices) {
      writeFieldValue({
        completion: deps.completion,
        athleteProfileId: deps.athleteProfileId,
        be,
        blockExerciseId,
        setIndex,
        position,
        value,
        setsStateRef: deps.setsStateRef,
        commitSetsState: deps.commitSetsState,
      });
    }
  };
  return {
    setFieldValue: (
      beId: string,
      setIndex: number,
      position: number,
      value: number,
    ) => write(beId, [setIndex], position, value),
    applyValueForward: (
      beId: string,
      position: number,
      value: number,
      targetSetIndices: number[],
    ) => write(beId, targetSetIndices, position, value),
  };
}

async function persistDoneToggle(params: {
  completion: SessionCompletionRow;
  athleteProfileId: string;
  be: AthleteBlockExercise;
  setIndex: number;
  row: SetRowState;
  nextDone: boolean;
}) {
  const { nextDone, ...rest } = params;
  if (nextDone) {
    await persistSetDone(rest);
  } else {
    await persistSetPending(rest);
  }
}

/** Toggles a set's done state — ticking logs it as completed, un-ticking
 * (tapping an already-done set) reverts the logged rows to "pending" so the
 * athlete can redo it. Applied optimistically: the tick/progress updates
 * immediately and the persistence call happens in the background, only
 * flipping back if it fails, so the athlete isn't stuck waiting on the
 * network for a response they've already visually confirmed. */
async function performSetDoneToggle(params: {
  session: AthleteSessionDetail;
  completion: SessionCompletionRow;
  athleteProfileId: string;
  setsStateRef: MutableRefObject<SetsByBlockExercise>;
  blockExerciseId: string;
  setIndex: number;
  commitSetsState: (next: SetsStateUpdater) => void;
}) {
  const {
    session,
    completion,
    athleteProfileId,
    setsStateRef,
    blockExerciseId,
    setIndex,
    commitSetsState,
  } = params;
  const be = findBlockExercise(session, blockExerciseId);
  // setsStateRef already reflects a field edit committed by this same tap's
  // blur (setFieldValue writes the ref synchronously), so this row carries
  // the value the athlete just typed — not a stale render closure.
  const row = setsStateRef.current[blockExerciseId]?.[setIndex];
  if (!be || !row) return;

  const nextDone = !row.done;
  commitSetsState((prev) =>
    markRowDone(prev, blockExerciseId, setIndex, nextDone),
  );

  try {
    await persistDoneToggle({
      completion,
      athleteProfileId,
      be,
      setIndex,
      row,
      nextDone,
    });
  } catch {
    // The done write is a single batched upsert, so a failure means nothing
    // landed — only local state needs reverting.
    commitSetsState((prev) =>
      markRowDone(prev, blockExerciseId, setIndex, !nextDone),
    );
  }
}

type ForceChange = {
  be: AthleteBlockExercise;
  setIndex: number;
  row: SetRowState;
};

function applyDone(
  state: SetsByBlockExercise,
  changes: ForceChange[],
  done: boolean,
): SetsByBlockExercise {
  return changes.reduce(
    (acc, c) => markRowDone(acc, c.be.id, c.setIndex, done),
    state,
  );
}

/** Forces a batch of sets to a given done state for "tick/untick all" —
 * the same optimistic update-then-persist shape as `performSetDoneToggle`,
 * but a force rather than a flip, and a silent no-op on any set already at
 * that state (an already-ticked row is left alone by a tick-all, and an
 * already-pending row by an untick-all). Every changed row flips locally in
 * ONE commit, and a tick-all persists in ONE batched upsert (all-or-nothing,
 * so a failure reverts the lot); an untick-all reverts only the sets whose
 * pending write failed. */
async function performSetsForceState(params: {
  session: AthleteSessionDetail;
  completion: SessionCompletionRow;
  athleteProfileId: string;
  setsStateRef: MutableRefObject<SetsByBlockExercise>;
  targets: GroupSetTarget[];
  done: boolean;
  commitSetsState: (next: SetsStateUpdater) => void;
}) {
  const { session, completion, athleteProfileId, done, commitSetsState } =
    params;
  const changes = params.targets.flatMap((t): ForceChange[] => {
    const be = findBlockExercise(session, t.blockExerciseId);
    const row = params.setsStateRef.current[t.blockExerciseId]?.[t.setIndex];
    if (!be || !row || row.done === done) return [];
    return [{ be, setIndex: t.setIndex, row }];
  });
  if (changes.length === 0) return;

  commitSetsState((prev) => applyDone(prev, changes, done));

  if (done) {
    try {
      await upsertSetLogs(
        changes.flatMap((c) =>
          setDoneLogInputs({ completion, athleteProfileId, ...c }),
        ),
      );
    } catch {
      commitSetsState((prev) => applyDone(prev, changes, false));
    }
    return;
  }

  const results = await Promise.allSettled(
    changes.map((c) =>
      persistSetPending({ completion, be: c.be, setIndex: c.setIndex }),
    ),
  );
  const failed = changes.filter((_, i) => results[i].status === "rejected");
  if (failed.length) commitSetsState((prev) => applyDone(prev, failed, true));
}

/** The `markSetDone` / `setManyDone` callbacks the player passes down —
 * `markSetDone` toggles one set (see `performSetDoneToggle`), `setManyDone`
 * forces a batch of sets to a given done state for the "tick all" button,
 * which itself toggles between ticking everything and unticking everything
 * (see `performSetForceState`). Grouped the same way as `makeFieldEditors`
 * so `useSessionPlayer` itself stays within the line-count lint budget.
 * Exported for tests. */
export function makeSetDoneHandlers(deps: {
  session: AthleteSessionDetail | null;
  completion: SessionCompletionRow | null;
  athleteProfileId: string | undefined;
  setsStateRef: MutableRefObject<SetsByBlockExercise>;
  commitSetsState: (next: SetsStateUpdater) => void;
}) {
  return {
    markSetDone: async (blockExerciseId: string, setIndex: number) => {
      const { session, completion, athleteProfileId } = deps;
      if (!completion || !athleteProfileId || !session) return;
      await performSetDoneToggle({
        session,
        completion,
        athleteProfileId,
        setsStateRef: deps.setsStateRef,
        blockExerciseId,
        setIndex,
        commitSetsState: deps.commitSetsState,
      });
    },
    setManyDone: async (targets: GroupSetTarget[], done: boolean) => {
      const { session, completion, athleteProfileId } = deps;
      if (!completion || !athleteProfileId || !session) return;
      await performSetsForceState({
        session,
        completion,
        athleteProfileId,
        setsStateRef: deps.setsStateRef,
        targets,
        done,
        commitSetsState: deps.commitSetsState,
      });
    },
  };
}

async function performPauseToggle(
  completion: SessionCompletionRow,
): Promise<SessionCompletionRow> {
  return completion.paused_at
    ? resumeSession(
        completion.id,
        completion.paused_at,
        completion.paused_duration_seconds,
      )
    : pauseSession(completion.id);
}

/** Locally mirrors what pause/resume will do server-side, so the UI can flip
 * immediately instead of waiting on the round trip. */
function computeOptimisticPauseFlip(
  completion: SessionCompletionRow,
): SessionCompletionRow {
  if (!completion.paused_at) {
    return { ...completion, paused_at: new Date().toISOString() };
  }
  const pausedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(completion.paused_at).getTime()) / 1000),
  );
  return {
    ...completion,
    paused_at: null,
    paused_duration_seconds: completion.paused_duration_seconds + pausedSeconds,
  };
}

function useInitialSessionLoad(params: {
  sessionId: string;
  athleteProfileId: string | undefined;
  setCompletion: (c: SessionCompletionRow) => void;
  setSession: (s: AthleteSessionDetail) => void;
  commitSetsState: (next: SetsStateUpdater) => void;
  setBlockIdx: (i: number) => void;
}) {
  const {
    sessionId,
    athleteProfileId,
    setCompletion,
    setSession,
    commitSetsState,
    setBlockIdx,
  } = params;
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!athleteProfileId || !sessionId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await loadSessionPlayerData(sessionId, athleteProfileId!);
        if (cancelled) return;
        setCompletion(data.completion);
        setSession(data.session);
        commitSetsState(data.setsState);
        setBlockIdx(data.blockIdx);
      } catch (e) {
        if (cancelled) return;
        // Without this the screen sits on a bare spinner forever with no way
        // out — the athlete has to force-kill the app.
        console.warn("Failed to load the session player", e);
        setLoadError(true);
      }
    }
    setLoadError(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [
    athleteProfileId,
    sessionId,
    setCompletion,
    setSession,
    commitSetsState,
    setBlockIdx,
    reloadKey,
  ]);

  return { loadError, retryLoad: () => setReloadKey((k) => k + 1) };
}

/** Owns every piece of state and every persistence call for the session
 * player screen: loading/resuming the attempt, per-set local edits, the
 * network call that actually logs a completed set, and pause/resume. The
 * screen itself just renders what this returns. */
export function useSessionPlayer(
  sessionId: string,
  athleteProfileId: string | undefined,
) {
  const [session, setSession] = useState<AthleteSessionDetail | null>(null);
  const [completion, setCompletion] = useState<SessionCompletionRow | null>(
    null,
  );
  const [setsState, setsStateRef, commitSetsState] = useRefBackedSetsState();
  const [blockIdx, setBlockIdx] = useState(0);
  const [pausing, setPausing] = useState(false);
  // Derived, not separate state — it's always exactly `!!completion.paused_at`,
  // and the optimistic pause flip already updates that on `completion`.
  const paused = !!completion?.paused_at;

  const { loadError, retryLoad } = useInitialSessionLoad({
    sessionId,
    athleteProfileId,
    setCompletion,
    setSession,
    commitSetsState,
    setBlockIdx,
  });

  // Read lazily (at call time) by the set actions below, so those can keep
  // one identity for the life of the screen: the whole set-row tree is
  // memoised on that, and a fresh callback per render would make every tick
  // re-render every block in the session.
  const latest = useRef({ session, completion, athleteProfileId });
  latest.current = { session, completion, athleteProfileId };

  const setActions = useMemo(() => {
    const deps = {
      get session() {
        return latest.current.session;
      },
      get completion() {
        return latest.current.completion;
      },
      get athleteProfileId() {
        return latest.current.athleteProfileId;
      },
      setsStateRef,
      commitSetsState,
    };
    return { ...makeFieldEditors(deps), ...makeSetDoneHandlers(deps) };
  }, [setsStateRef, commitSetsState]);

  /** Optimistic: flip paused immediately, then reconcile with (or revert to)
   * the server response in the background. */
  async function togglePause() {
    if (!completion || pausing) return;
    const prevCompletion = completion;
    setCompletion(computeOptimisticPauseFlip(completion));
    setPausing(true);
    try {
      setCompletion(await performPauseToggle(prevCompletion));
    } catch {
      setCompletion(prevCompletion);
    } finally {
      setPausing(false);
    }
  }

  return {
    session,
    completion,
    setsState,
    blockIdx,
    setBlockIdx,
    paused,
    pausing,
    loadError,
    retryLoad,
    setActions,
    togglePause,
  };
}
