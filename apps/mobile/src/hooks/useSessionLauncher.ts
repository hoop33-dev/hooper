import {
  getInProgressCompletion,
  restartSession,
  startOrResumeSession,
} from "@/src/services/sessionCompletion.service";
import type { ProgramRow } from "@hooper/db";
import { useRouter, type Router } from "expo-router";
import { useRef, useState } from "react";

/** Opens the player on an existing (in-progress) attempt. */
function routeToPlayer(router: Router, sessionId: string) {
  router.push({
    pathname: "/(app)/training/play",
    params: { sessionId },
  });
}

/** Starts a session with no attempt in progress — through the pre-session
 * form if the program has one with questions to ask, otherwise straight into
 * the player (an empty form would only flash the pre-form screen). Works for
 * any session, not just the current one, so an athlete can jump ahead or redo
 * a past one. */
async function routeToFreshSession(
  router: Router,
  sessionId: string,
  program: ProgramRow,
  hasCheckIn: boolean,
  athleteProfileId: string,
) {
  if (hasCheckIn) {
    router.push({
      pathname: "/(app)/training/pre-form",
      params: { sessionId, programId: program.id },
    });
    return;
  }
  await startOrResumeSession(sessionId, athleteProfileId);
  routeToPlayer(router, sessionId);
}

/** Turns the session preview's start tap into navigation: straight in for a
 * fresh session, or a Continue/Restart prompt when there's already an
 * in-progress attempt. `restart` abandons that attempt (keeping its logs)
 * before starting over. */
export function useSessionLauncher(
  sessionId: string,
  program: ProgramRow | null,
  /** Whether the program's check-in form has any questions. */
  hasCheckIn: boolean,
  athleteProfileId: string | undefined,
) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [pendingResume, setPendingResume] = useState(false);
  // `starting` drives the button UI, but it's read from the render closure —
  // two taps before a re-render would both see false. The ref is the real
  // re-entrancy guard for start and restart.
  const inFlight = useRef(false);

  async function start() {
    if (!athleteProfileId || !program || inFlight.current) return;
    inFlight.current = true;
    setStarting(true);
    try {
      if (await getInProgressCompletion(sessionId, athleteProfileId)) {
        setPendingResume(true);
        return;
      }
      await routeToFreshSession(
        router,
        sessionId,
        program,
        hasCheckIn,
        athleteProfileId,
      );
    } finally {
      inFlight.current = false;
      setStarting(false);
    }
  }

  async function restart() {
    if (!athleteProfileId || !program || inFlight.current) return;
    inFlight.current = true;
    setPendingResume(false);
    setStarting(true);
    try {
      await restartSession(sessionId, athleteProfileId);
      await routeToFreshSession(
        router,
        sessionId,
        program,
        hasCheckIn,
        athleteProfileId,
      );
    } finally {
      inFlight.current = false;
      setStarting(false);
    }
  }

  return {
    starting,
    pendingResume,
    start,
    restart,
    continueResume: () => {
      setPendingResume(false);
      routeToPlayer(router, sessionId);
    },
    cancelResume: () => setPendingResume(false),
  };
}
