"use client";

import { useState } from "react";

type ProgramOption = { id: string; name: string };

/** Loads the "assign programs" picker list on first demand rather than on every
 * athlete / team detail page render (see `listAssignableProgramsAction`).
 * `open()` shows the modal and kicks off the fetch once. */
export function useLazyPrograms(load: () => Promise<ProgramOption[]>) {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded">("idle");

  async function open() {
    setIsOpen(true);
    if (status === "loading" || status === "loaded") return;
    setStatus("loading");
    try {
      setPrograms(await load());
      setStatus("loaded");
    } catch {
      // Stay "idle" so reopening the modal retries rather than leaving the
      // picker permanently empty.
      setStatus("idle");
    }
  }

  return {
    isOpen,
    close: () => setIsOpen(false),
    open,
    programs,
    loading: status !== "loaded",
  };
}
