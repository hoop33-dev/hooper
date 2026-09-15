"use client";

import { useEffect, useRef, useState } from "react";

const CONFIRM_TIMEOUT_MS = 4000;

export type InlineConfirmState = "idle" | "armed" | "confirming";

/** Powers a delete button that pops up an explicit inline "Confirm" step
 * rather than a modal: clicking the delete control arms it (caller swaps in
 * a "Confirm" affordance), clicking that confirms and awaits `onConfirm`
 * while callers show a spinner in `state === "confirming"`. Arming
 * auto-expires so a stray click doesn't leave a button primed forever. If
 * `onConfirm` throws/rejects, state falls back to "idle" so the action can
 * be retried; on success the row usually unmounts before that matters. */
export function useInlineConfirm(onConfirm: () => void | Promise<void>) {
  const [state, setState] = useState<InlineConfirmState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  function arm() {
    setState("armed");
    timeoutRef.current = setTimeout(() => setState("idle"), CONFIRM_TIMEOUT_MS);
  }

  function cancel() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState("idle");
  }

  async function confirm() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState("confirming");
    try {
      await onConfirm();
    } finally {
      setState("idle");
    }
  }

  return {
    state,
    armed: state === "armed",
    confirming: state === "confirming",
    arm,
    cancel,
    confirm,
  } as const;
}
