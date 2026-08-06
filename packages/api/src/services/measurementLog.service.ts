import { getClient } from "../client";
import type { AthleteMeasurementLogRow, MeasurementLogStatus } from "@hooper/db";
import type { AthleteSessionDetail } from "./program.service";

export type UpsertSetLogInput = {
  sessionCompletionId: string;
  blockExerciseId: string;
  /** Which unit-type slot, matches block_exercise_measurements.position. */
  position: number;
  setIndex: number;
  athleteProfileId: string;
  exerciseId: string;
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
export async function upsertSetLog(
  input: UpsertSetLogInput,
): Promise<AthleteMeasurementLogRow> {
  const client = getClient();
  const { data, error } = await client
    .from("athlete_measurement_logs")
    .upsert(
      {
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
        logged_at: new Date().toISOString(),
      },
      {
        onConflict: "session_completion_id,block_exercise_id,position,set_index",
      },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
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
  const blanks = new Map<PrefillKey, { exerciseId: string; unitType: string }>();
  for (const block of session.blocks) {
    for (const blockExercise of block.exercises) {
      for (const measurement of blockExercise.measurements) {
        if (measurement.value_entered_by === "athlete" && measurement.value === null) {
          const key = prefillKey(blockExercise.exercise_id, measurement.unit_type);
          blanks.set(key, {
            exerciseId: blockExercise.exercise_id,
            unitType: measurement.unit_type,
          });
        }
      }
    }
  }

  const entries = await Promise.all(
    [...blanks.entries()].map(async ([key, { exerciseId, unitType }]) => {
      const value = await getLastLoggedValue(athleteProfileId, exerciseId, unitType);
      return [key, value] as const;
    }),
  );

  const result = new Map<PrefillKey, number>();
  for (const [key, value] of entries) {
    if (value !== null) result.set(key, value);
  }
  return result;
}
