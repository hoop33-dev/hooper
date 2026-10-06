import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

/**
 * Intercepts every way off the current screen — a custom back button, the
 * Android hardware back button, and the Android/iOS edge-swipe gesture all
 * surface as `beforeRemove` — and holds it until `confirmExit`/`cancelExit`
 * decide whether to let it through.
 *
 * Pass `enabled: false` to skip interception (e.g. while a form is clean),
 * and call `allowLeave` before a programmatic navigation that should bypass
 * the guard entirely (e.g. after a successful save).
 */
export function useExitGuard(enabled = true) {
  const router = useRouter();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const allowLeaveRef = useRef(false);
  const pendingActionRef = useRef<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (allowLeaveRef.current || !enabled) return;
      e.preventDefault();
      pendingActionRef.current = e.data.action;
      setVisible(true);
    });
    return unsubscribe;
  }, [navigation, enabled]);

  function requestExit() {
    setVisible(true);
  }

  function confirmExit() {
    setVisible(false);
    allowLeaveRef.current = true;
    if (pendingActionRef.current) {
      navigation.dispatch(pendingActionRef.current);
    } else {
      router.back();
    }
  }

  function cancelExit() {
    pendingActionRef.current = null;
    setVisible(false);
  }

  function allowLeave() {
    allowLeaveRef.current = true;
  }

  return { visible, requestExit, confirmExit, cancelExit, allowLeave };
}
