import type {
  AthleteMeasurementLogRow,
  MeasurementLogStatus,
} from "@hooper/db";
import { getClient } from "../client";
import type { AthleteSessionDetail } from "./program.service";

/** A set with no measurements (e.g. a sequence the coach didn't attach any
 * values to — the web builder's default) still has to persist "done", or it
 * reloads as not done on resume. It's logged as one marker row at this
 * position (real measurement positions are 0-2) with a null value, which
 * the prefill / history lookups already skip. */
export const SET_DONE_MARKER_POSITION = -1;
export const SET_DONE_MARKER_UNIT = "set_done";

export type UpsertSetLogInput = {
  sessionCompletionId: string;
  blockExerciseId: string;
  /** Which unit-type slot, matches block_exercise_measurements.position. */
  position: number;
  setIndex: number;
  athleteProfileId: string;
  /** Null for a sequence placement, which has no single exercise. */
  exerciseId: string | null;
  unitType: string;
  /** Snapshot of the coach's planned value at logging time. */
  plannedValue: number | null;
  actualValue: number | null;
  status?: MeasurementLogStatus;
};

/** Fires on every set-confirm in the session player — logging is
 * incremental, not batched to a final submit, so a killed app loses at most
 * the set in progress. Upserts on the same (session_completion_id,
 * block_exercise_id, position, set_index) grain as the row's primary key,
 * so re-confirming a set (e.g. correcting a typo before moving on) updates
 * it in place. */
const SET_LOG_CONFLICT =
  "session_completion_id,block_exercise_id,position,set_index";

function toSetLogRow(input: UpsertSetLogInput, loggedAt: string) {
  return {
    session_completion_id: input.sessionCompletionId,
    block_exercise_id: input.blockExerciseId,
    position: input.position,
    set_index: input.setIndex,
    athlete_profile_id: input.athleteProfileId,
    exercise_id: input.exerciseId,
    unit_type: input.unitType,
    planned_value: input.plannedValue,
    actual_value: input.actualValue,
    status: input.status ?? "completed",
    logged_at: loggedAt,
  };
}

export async function upsertSetLog(
  input: UpsertSetLogInput,
): Promise<AthleteMeasurementLogRow> {
  const client = getClient();
  const { data, error } = await client
    .from("athlete_measurement_logs")
    .upsert(toSetLogRow(input, new Date().toISOString()), {
      onConflict: SET_LOG_CONFLICT,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Batch form of upsertSetLog — every measurement row of a set (or of every
 * set in a "tick all") in ONE request and one statement, so a set lands
 * all-or-nothing instead of position-by-position, and the tap costs one
 * round trip rather than one per measurement. Returns nothing (no
 * `.select()`): the player already holds the values it wrote. */
export async function upsertSetLogs(
  inputs: UpsertSetLogInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  const loggedAt = new Date().toISOString();
  const client = getClient();
  const { error } = await client.from("athlete_measurement_logs").upsert(
    inputs.map((input) => toSetLogRow(input, loggedAt)),
    { onConflict: SET_LOG_CONFLICT },
  );
  if (error) throw new Error(error.message);
}

/** Un-marks a previously logged set, reverting every measurement row for it
 * back to "pending" — the inverse of upsertSetLog's "completed" write. Keeps
 * the logged value rather than clearing it, since the athlete is undoing a
 * mis-tap, not the number they entered. */
export async function markSetPending(params: {
  sessionCompletionId: string;
  blockExerciseId: string;
  setIndex: number;
  positions: number[];
}): Promise<void> {
  const { sessionCompletionId, blockExerciseId, setIndex, positions } = params;
  const client = getClient();
  const { error } = await client
    .from("athlete_measurement_logs")
    .update({ status: "pending" })
    .eq("session_completion_id", sessionCompletionId)
    .eq("block_exercise_id", blockExerciseId)
    .eq("set_index", setIndex)
    .in("position", positions);
  if (error) throw new Error(error.message);
}

/** Reloads every logged set for an in-progress (or completed) session
 * attempt — this plus the session's block/exercise tree is all that's
 * needed to reconstruct exactly where the athlete left off on resume; no
 * separate "current position" is stored anywhere. */
export async function getLogsForCompletion(
  sessionCompletionId: string,
): Promise<AthleteMeasurementLogRow[]> {
  const client = getClient();
  const { data, error } = await client
    .from("athlete_measurement_logs")
    .select("*")
    .eq("session_completion_id", sessionCompletionId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Full logged history for one exercise, most recent first — the "all
 * information for an exercise for a person" progress-tracking query.
 * athlete_profile_id + exercise_id are denormalized onto the log rows
 * specifically so this is a single indexed lookup. */
export async function listExerciseHistory(
  athleteProfileId: string,
  exerciseId: string,
  limit = 50,
): Promise<AthleteMeasurementLogRow[]> {
  const client = getClient();
  const { data, error } = await client
    .from("athlete_measurement_logs")
    .select("*")
    .eq("athlete_profile_id", athleteProfileId)
    .eq("exercise_id", exerciseId)
    .eq("status", "completed")
    .gte("position", 0) // skip set-done markers — they carry no value
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getLastLoggedValue(
  athleteProfileId: string,
  exerciseId: string,
  unitType: string,
): Promise<number | null> {
  const client = getClient();
  const { data, error } = await client
    .from("athlete_measurement_logs")
    .select("actual_value")
    .eq("athlete_profile_id", athleteProfileId)
    .eq("exercise_id", exerciseId)
    .eq("unit_type", unitType)
    .eq("status", "completed")
    .not("actual_value", "is", null)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.actual_value ?? null;
}

export type PrefillKey = string;

export function prefillKey(exerciseId: string, unitType: string): PrefillKey {
  return `${exerciseId}:${unitType}`;
}

/**
 * For every measurement the coach left blank for the athlete to fill in
 * (`value_entered_by === 'athlete' && value === null`), looks up the
 * athlete's most recent logged value for that exercise+unit so the player
 * can pre-fill it instead of showing a bare default. A coach-specified
 * value is never overridden by history — this only fills genuine blanks.
 */
export async function buildPrefillMap(
  athleteProfileId: string,
  session: AthleteSessionDetail,
): Promise<Map<PrefillKey, number>> {
  const blanks = new Map<
    PrefillKey,
    { exerciseId: string; unitType: string }
  >();
  for (const block of session.blocks) {
    for (const blockExercise of block.exercises) {
      // A sequence has no exercise history to pre-fill from.
      if (blockExercise.exercise_id === null) continue;
      for (const measurement of blockExercise.measurements) {
        if (
          measurement.value_entered_by === "athlete" &&
          measurement.value === null
        ) {
          const exerciseId =
            blockExercise.setVariants[measurement.set_index]?.id ??
            blockExercise.exercise_id;
          const key = prefillKey(exerciseId, measurement.unit_type);
          blanks.set(key, { exerciseId, unitType: measurement.unit_type });
        }
      }
    }
  }

  if (blanks.size === 0) return new Map();
  const pairs = [...blanks.values()];
  const batched = await fetchLastLoggedValues(athleteProfileId, pairs);
  if (batched) return batched;

  const entries = await Promise.all(
    [...blanks.entries()].map(async ([key, { exerciseId, unitType }]) => {
      const value = await getLastLoggedValue(
        athleteProfileId,
        exerciseId,
        unitType,
      );
      return [key, value] as const;
    }),
  );

  const result = new Map<PrefillKey, number>();
  for (const [key, value] of entries) {
    if (value !== null) result.set(key, value);
  }
  return result;
}

/** Every pair's last logged value in ONE request via the
 * `last_logged_values` RPC (see its migration). Returns null when the RPC
 * call fails — e.g. the migration isn't on this database yet — so the
 * caller falls back to one lookup per pair. */
async function fetchLastLoggedValues(
  athleteProfileId: string,
  pairs: { exerciseId: string; unitType: string }[],
): Promise<Map<PrefillKey, number> | null> {
  let data: unknown;
  try {
    const res = await getClient().rpc("last_logged_values", {
      p_athlete_profile_id: athleteProfileId,
      p_exercise_ids: pairs.map((p) => p.exerciseId),
      p_unit_types: pairs.map((p) => p.unitType),
    });
    if (res.error) return null;
    data = res.data;
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  const result = new Map<PrefillKey, number>();
  for (const row of data as {
    exercise_id: string;
    unit_type: string;
    actual_value: number | string | null;
  }[]) {
    if (row.actual_value === null) continue;
    result.set(
      prefillKey(row.exercise_id, row.unit_type),
      Number(row.actual_value),
    );
  }
  return result;
}
