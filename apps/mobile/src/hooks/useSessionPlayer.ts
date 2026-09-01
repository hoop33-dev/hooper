import type { SetRowState } from "@/src/components/training/ExerciseSetsCard";
import { resolveSetExercise } from "@/src/lib/blockExerciseDisplay";
import {
  buildPrefillMap,
  getLogsForCompletion,
  markSetPending,
  prefillKey,
  upsertSetLog,
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
import { useEffect, useRef, useState, type MutableRefObject } from "react";

export type SetsByBlockExercise = Record<string, SetRowState[]>;

/** A ref that always holds the latest render's value — lets an async callback
 * read state the render closure captured stale (e.g. a field edit whose
 * setState is still queued when a set-done tap fires in the same gesture). */
function useSyncedRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function buildExerciseSets(
  be: AthleteBlockExercise,
  beLogs: AthleteMeasurementLogRow[],
  prefill: Map<string, number>,
): SetRowState[] {
  const rows: SetRowState[] = [];
  for (let setIndex = 0; setIndex < be.sets; setIndex++) {
    const done = beLogs.some(
      (l) => l.set_index === setIndex && l.status === "completed",
    );
    const values: Record<number, number> = {};
    for (const m of be.measurements.filter((m) => m.set_index === setIndex)) {
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

function buildInitialSetsState(
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

async function loadSessionPlayerData(
  sessionId: string,
  athleteProfileId: string,
) {
  const [completion, session] = await Promise.all([
    startOrResumeSession(sessionId, athleteProfileId),
    getSessionDetail(sessionId),
  ]);
  const [logs, prefill] = await Promise.all([
    getLogsForCompletion(completion.id),
    buildPrefillMap(athleteProfileId, session),
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
  const positions = be.measurements
    .filter((m) => m.set_index === setIndex)
    .map((m) => m.position);
  await markSetPending({
    sessionCompletionId: completion.id,
    blockExerciseId: be.id,
    setIndex,
    positions,
  });
}

async function persistSetDone(params: {
  completion: SessionCompletionRow;
  athleteProfileId: string;
  be: AthleteBlockExercise;
  setIndex: number;
  row: SetRowState;
}) {
  const { completion, athleteProfileId, be, setIndex, row } = params;
  const positions = be.measurements.filter((m) => m.set_index === setIndex);
  const exerciseId = resolveSetExercise(be, setIndex).id;
  await Promise.all(
    positions.map((m) =>
      upsertSetLog({
        sessionCompletionId: completion.id,
        blockExerciseId: be.id,
        position: m.position,
        setIndex,
        athleteProfileId,
        exerciseId,
        unitType: m.unit_type,
        plannedValue: m.value,
        actualValue: row.values[m.position] ?? null,
        status: "completed",
      }),
    ),
  );
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
  setSetsState: (
    updater: (prev: SetsByBlockExercise) => SetsByBlockExercise,
  ) => void;
}) {
  const {
    session,
    completion,
    athleteProfileId,
    setsStateRef,
    blockExerciseId,
    setIndex,
    setSetsState,
  } = params;
  const be = findBlockExercise(session, blockExerciseId);
  if (!be) return;

  let nextDone: boolean | null = null;
  setSetsState((prev) => {
    const row = prev[blockExerciseId]?.[setIndex];
    if (!row) return prev;
    nextDone = !row.done;
    return markRowDone(prev, blockExerciseId, setIndex, nextDone);
  });

  // Let React flush the toggle above along with any field-commit update still
  // queued from the same tap — tapping the done button blurs a focused
  // FieldBox, and its onBlur `commit()` runs just before this handler. Read
  // the row back from the committed state so we persist the value the athlete
  // just typed, not the stale pre-edit one from a render closure.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (nextDone === null) return;

  const row = setsStateRef.current[blockExerciseId]?.[setIndex];
  if (!row) return;
  const toggledTo = nextDone;
  try {
    await persistDoneToggle({
      completion,
      athleteProfileId,
      be,
      setIndex,
      row,
      nextDone: toggledTo,
    });
  } catch {
    setSetsState((prev) =>
      markRowDone(prev, blockExerciseId, setIndex, !toggledTo),
    );
  }
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

function useInitialSessionLoad(
  sessionId: string,
  athleteProfileId: string | undefined,
  setCompletion: (c: SessionCompletionRow) => void,
  setSession: (s: AthleteSessionDetail) => void,
  setSetsState: (s: SetsByBlockExercise) => void,
  setBlockIdx: (i: number) => void,
  setPaused: (p: boolean) => void,
) {
  useEffect(() => {
    if (!athleteProfileId || !sessionId) return;
    let cancelled = false;
    async function load() {
      const data = await loadSessionPlayerData(sessionId, athleteProfileId!);
      if (cancelled) return;
      setCompletion(data.completion);
      setSession(data.session);
      setSetsState(data.setsState);
      setBlockIdx(data.blockIdx);
      setPaused(!!data.completion.paused_at);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [
    athleteProfileId,
    sessionId,
    setCompletion,
    setSession,
    setSetsState,
    setBlockIdx,
    setPaused,
  ]);
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
  const [setsState, setSetsState] = useState<SetsByBlockExercise>({});
  const setsStateRef = useSyncedRef(setsState);
  const [blockIdx, setBlockIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);

  useInitialSessionLoad(
    sessionId,
    athleteProfileId,
    setCompletion,
    setSession,
    setSetsState,
    setBlockIdx,
    setPaused,
  );

  function setFieldValue(
    blockExerciseId: string,
    setIndex: number,
    position: number,
    value: number,
  ) {
    setSetsState((prev) =>
      applyFieldValue(prev, blockExerciseId, setIndex, position, value),
    );
  }

  async function markSetDone(blockExerciseId: string, setIndex: number) {
    if (!completion || !athleteProfileId || !session) return;
    await performSetDoneToggle({
      session,
      completion,
      athleteProfileId,
      setsStateRef,
      blockExerciseId,
      setIndex,
      setSetsState,
    });
  }

  /** Optimistic: flips the paused state immediately so the button/overlay
   * respond without waiting on the network, then reconciles with (or
   * reverts to) the server response in the background. */
  async function togglePause() {
    if (!completion || pausing) return;
    const prevCompletion = completion;
    const wasPaused = !!completion.paused_at;
    setCompletion(computeOptimisticPauseFlip(completion));
    setPaused(!wasPaused);
    setPausing(true);
    try {
      setCompletion(await performPauseToggle(prevCompletion));
    } catch {
      setCompletion(prevCompletion);
      setPaused(wasPaused);
    } finally {
      setPausing(false);
    }
  }

  function goBlock(delta: number) {
    if (!session) return;
    setBlockIdx((i) =>
      Math.min(session.blocks.length - 1, Math.max(0, i + delta)),
    );
  }

  return {
    session,
    completion,
    setsState,
    blockIdx,
    setBlockIdx,
    paused,
    pausing,
    setFieldValue,
    markSetDone,
    togglePause,
    goBlock,
  };
}
