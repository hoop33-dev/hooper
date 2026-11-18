import {
  getGuardianControls,
  type GuardianControls,
} from "@/src/services/parent.service";
import { useEffect, useState } from "react";

const DEFAULT: GuardianControls = {
  isManaged: false,
  profileSettingsLocked: false,
};

/**
 * Loads the guardian controls that apply to the signed-in user. Every
 * account gets the athlete view, so this always runs; an account that isn't
 * a managed child just gets the unlocked defaults back.
 */
export function useGuardianControls(): GuardianControls & {
  isLoading: boolean;
} {
  const [controls, setControls] = useState<GuardianControls>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void (async () => {
      const c = await getGuardianControls();
      if (!cancelled) {
        setControls(c);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...controls, isLoading };
}
