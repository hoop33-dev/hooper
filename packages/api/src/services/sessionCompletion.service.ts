import type { SessionCompletionRow } from "@hooper/db";
import { getClient } from "../client";

/** Local calendar day (not UTC) — the DB's CURRENT_DATE default would use
 * the server's timezone, which is the wrong axis for "which day did the
 * athlete do this," so the client always sets it explicitly. */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getCompletion(
  sessionCompletionId: string,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const { data, error } = await client
    .from("session_completions")
    .select("*")
    .eq("id", sessionCompletionId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Used before showing the pre-session form: if the athlete already has an
 * in-progress attempt at this session (crash/close mid-session, or the form
 * was submitted but the app closed before reaching the player), the route
 * should skip straight to the player instead of asking the check-in
 * questions again. */
export async function getInProgressCompletion(
  sessionId: string,
  athleteProfileId: string,
): Promise<SessionCompletionRow | null> {
  const client = getClient();
  const { data, error } = await client
    .from("session_completions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("athlete_profile_id", athleteProfileId)
    .eq("status", "in_progress")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Resumes the athlete's in-progress attempt at this session if one exists
 * (app was closed/crashed mid-session), otherwise starts a new one. At most
 * one in_progress row can exist per (session, athlete) — enforced by a
 * partial unique index — so this is always safe to call without a separate
 * "does one exist" check from the caller. */
export async function startOrResumeSession(
  sessionId: string,
  athleteProfileId: string,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const { data: existing, error: existingError } = await client
    .from("session_completions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("athlete_profile_id", athleteProfileId)
    .eq("status", "in_progress")
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data, error } = await client
    .from("session_completions")
    .insert({
      session_id: sessionId,
      athlete_profile_id: athleteProfileId,
      session_date: formatLocalDate(new Date()),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function pauseSession(
  sessionCompletionId: string,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const { data, error } = await client
    .from("session_completions")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", sessionCompletionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Takes the caller's already-known `paused_at`/`paused_duration_seconds`
 * (the client has these in local state from when it paused) rather than
 * re-fetching them first, so resuming is a single round trip instead of a
 * select-then-update. */
export async function resumeSession(
  sessionCompletionId: string,
  pausedAt: string,
  pausedDurationSeconds: number,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const pausedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(pausedAt).getTime()) / 1000),
  );

  const { data, error } = await client
    .from("session_completions")
    .update({
      paused_at: null,
      paused_duration_seconds: pausedDurationSeconds + pausedSeconds,
    })
    .eq("id", sessionCompletionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function completeSession(
  sessionCompletionId: string,
  effortRpe: number,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const { data: current, error: currentError } = await client
    .from("session_completions")
    .select("started_at, paused_at, paused_duration_seconds")
    .eq("id", sessionCompletionId)
    .single();
  if (currentError) throw new Error(currentError.message);

  const now = new Date();
  // Defensive: fold in a still-open pause (shouldn't normally happen — the
  // player resumes before allowing "Complete session" — but this keeps the
  // duration honest even if it does).
  const trailingPause = current.paused_at
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(current.paused_at).getTime()) / 1000,
        ),
      )
    : 0;
  const totalPausedSeconds = current.paused_duration_seconds + trailingPause;
  const totalElapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(current.started_at).getTime()) / 1000),
  );
  const activeDurationSeconds = Math.max(
    0,
    totalElapsedSeconds - totalPausedSeconds,
  );

  const { data, error } = await client
    .from("session_completions")
    .update({
      status: "completed",
      completed_at: now.toISOString(),
      paused_at: null,
      paused_duration_seconds: totalPausedSeconds,
      active_duration_seconds: activeDurationSeconds,
      effort_rpe: effortRpe,
    })
    .eq("id", sessionCompletionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
