import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Mirrors the OS "reduce motion" accessibility setting, defaulting to false
 * until the async check resolves (matches AccessibilityInfo's own default). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      const value = await AccessibilityInfo.isReduceMotionEnabled();
      if (mounted) setReduced(value);
    }
    loadInitial();
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
