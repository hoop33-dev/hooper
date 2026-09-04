"use client";

import { useState } from "react";

type ProgramOption = { id: string; name: string };

/** Loads the "assign programs" picker list on first demand rather than on every
 * athlete / team detail page render (see `listAssignableProgramsAction`).
 * `open()` shows the modal and kicks off the fetch once. */
export function useLazyPrograms(load: () => Promise<ProgramOption[]>) {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function open() {
    setIsOpen(true);
    if (loaded) return;
    try {
      setPrograms(await load());
    } finally {
      setLoaded(true);
    }
  }

  return {
    isOpen,
    close: () => setIsOpen(false),
    open,
    programs,
    loading: !loaded,
  };
}
