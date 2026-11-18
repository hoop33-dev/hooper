import { completeSession } from "@/src/services/sessionCompletion.service";
import { useEffect, useRef, useState } from "react";

/**
 * Marks the attempt completed the moment its last set is logged, instead of
 * relying on the athlete pressing "Complete session" and reaching the
 * summary screen. Athletes who log everything and then just leave (X /
 * back / closing the app) used to leave the session in_progress forever.
 *
 * Runs in the background and is idempotent server-side: completeSession on
 * an already-completed row returns it unchanged, so the summary screen's own
 * finalise call (and its effort-RPE update) still works normally afterwards.
 * A failed attempt re-arms, so it's retried the next time every set is done
 * (and the summary screen finalises regardless).
 *
 * Returns true once the attempt is confirmed completed — the player uses that
 * to stop warning that leaving would leave the session unfinished.
 */
export function useAutoFinalizeSession(
  completionId: string | undefined,
  doneSets: number,
  totalSets: number,
) {
  const [finalized, setFinalized] = useState(false);
  const attempted = useRef(false);
  const allDone = totalSets > 0 && doneSets === totalSets;

  useEffect(() => {
    if (!allDone || !completionId || attempted.current) return;
    attempted.current = true;
    async function finalize(id: string) {
      try {
        await completeSession(id, null);
        setFinalized(true);
      } catch (e) {
        console.warn("Couldn't auto-complete the session", e);
        attempted.current = false;
      }
    }
    finalize(completionId);
  }, [allDone, completionId]);

  return finalized;
}
