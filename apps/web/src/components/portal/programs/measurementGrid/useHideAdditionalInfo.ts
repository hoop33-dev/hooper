"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hooper:hideAdditionalInfo";

/** Whether the measurement modals (single-exercise and superset) should
 * show their simplified view — one Variant/Style picker and shared value
 * columns — instead of full per-set unit-type/variant/style controls.
 * Persisted in localStorage so it stays off (the default) or on across
 * every exercise the coach opens, not just for the current modal. Starts
 * `false` on every render (including the server-rendered first paint) and
 * syncs from storage in an effect, since localStorage isn't available
 * server-side — a coach who previously turned it on sees the default
 * (full detail) flash briefly before it corrects, rather than a hydration
 * mismatch. */
export function useHideAdditionalInfo() {
  const [hideAdditionalInfo, setHideAdditionalInfo] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setHideAdditionalInfo(stored === "true");
  }, []);

  function set(next: boolean) {
    setHideAdditionalInfo(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  return [hideAdditionalInfo, set] as const;
}
