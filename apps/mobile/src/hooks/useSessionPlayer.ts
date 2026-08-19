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
import { useEffect, useState } from "react";

export type SetsByBlockExercise = Record<string, SetRowState[]>;
export type SheetState = {
  blockExerciseId: string;
  setIndex: number;
  position: number;
  unitType: string;
  exerciseName: string;
  currentValue: number;
};

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

function buildSheetState(
  be: AthleteBlockExercise,
  setIndex: number,
  position: number,
  setsState: SetsByBlockExercise,
): SheetState | null {
  const measurement = be.measurements.find(
    (m) => m.position === position && m.set_index === setIndex,
  );
  if (!measurement) return null;
  return {
    blockExerciseId: be.id,
    setIndex,
    position,
    unitType: measurement.unit_type,
    exerciseName: resolveSetExercise(be, setIndex).name,
    currentValue: setsState[be.id]?.[setIndex]?.values[position] ?? 0,
  };
}

function applyFieldValue(
  setsState: SetsByBlockExercise,
  sheet: SheetState | null,
  value: number,
): SetsByBlockExercise {
  if (!sheet) return setsState;
  const rows = [...(setsState[sheet.blockExerciseId] ?? [])];
  const row = rows[sheet.setIndex];
  if (!row) return setsState;
  rows[sheet.setIndex] = {
    ...row,
    values: { ...row.values, [sheet.position]: value },
  };
  return { ...setsState, [sheet.blockExerciseId]: rows };
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

async function performPauseToggle(
  completionId: string,
  paused: boolean,
): Promise<SessionCompletionRow> {
  return paused ? resumeSession(completionId) : pauseSession(completionId);
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
  const [blockIdx, setBlockIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);

  useInitialSessionLoad(
    sessionId,
    athleteProfileId,
    setCompletion,
    setSession,
    setSetsState,
    setBlockIdx,
    setPaused,
  );

  const openField = (
    be: AthleteBlockExercise,
    setIndex: number,
    position: number,
  ) => setSheet(buildSheetState(be, setIndex, position, setsState));

  function confirmField(value: number) {
    setSetsState((prev) => applyFieldValue(prev, sheet, value));
    setSheet(null);
  }

  /** Toggles a set's done state — ticking logs it as completed, un-ticking
   * (tapping an already-done set) reverts the logged rows to "pending" so
   * the athlete can redo it. */
  async function markSetDone(blockExerciseId: string, setIndex: number) {
    if (!completion || !athleteProfileId || !session) return;
    const be = findBlockExercise(session, blockExerciseId);
    const row = setsState[blockExerciseId]?.[setIndex];
    if (!be || !row) return;
    if (row.done) {
      await persistSetPending({ completion, be, setIndex });
      setSetsState((prev) =>
        markRowDone(prev, blockExerciseId, setIndex, false),
      );
      return;
    }
    await persistSetDone({ completion, athleteProfileId, be, setIndex, row });
    setSetsState((prev) => markRowDone(prev, blockExerciseId, setIndex, true));
  }

  async function togglePause() {
    if (!completion || pausing) return;
    setPausing(true);
    try {
      const updated = await performPauseToggle(completion.id, paused);
      setCompletion(updated);
      setPaused((p) => !p);
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
    sheet,
    openField,
    confirmField,
    closeSheet: () => setSheet(null),
    markSetDone,
    togglePause,
    goBlock,
  };
}
