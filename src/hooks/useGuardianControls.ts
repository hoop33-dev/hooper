import { useState, useEffect } from "react";
import {
  getGuardianControls,
  type GuardianControls,
} from "@/src/services/parent.service";

const DEFAULT: GuardianControls = {
  isManaged: false,
  profileSettingsLocked: false,
};

/**
 * Loads the guardian controls that apply to the signed-in player.
 * Pass `enabled = false` (e.g. for non-player roles) to skip the lookup
 * entirely — parents and coaches are never "managed".
 */
export function useGuardianControls(enabled = true): GuardianControls & {
  isLoading: boolean;
} {
  const [controls, setControls] = useState<GuardianControls>(DEFAULT);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setControls(DEFAULT);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getGuardianControls().then((c) => {
      if (!cancelled) {
        setControls(c);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...controls, isLoading };
}
