"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

interface ProgramHeaderCollapse {
  /** When true, <PageHeader>'s middle band (title, subtitle, "Edit program")
   * is hidden — the back/breadcrumb rail and the WeekTabStrip stay put. */
  headerCollapsed: boolean;
  setHeaderCollapsed: (value: boolean) => void;
  toggleHeaderCollapsed: () => void;
}

const ProgramHeaderCollapseContext =
  createContext<ProgramHeaderCollapse | null>(null);

/** Shares the program-week editor's header-collapse state between the
 * <PageHeader> (rendered by the page) and the WeekTabStrip toggle +
 * Shift+E handler (rendered deep inside <ProgramCanvasShell>), which sit in
 * sibling subtrees with no common client ancestor otherwise. */
export function ProgramHeaderCollapseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const value = useMemo<ProgramHeaderCollapse>(
    () => ({
      headerCollapsed,
      setHeaderCollapsed,
      toggleHeaderCollapsed: () => setHeaderCollapsed((v) => !v),
    }),
    [headerCollapsed],
  );
  return (
    <ProgramHeaderCollapseContext.Provider value={value}>
      {children}
    </ProgramHeaderCollapseContext.Provider>
  );
}

export function useProgramHeaderCollapse(): ProgramHeaderCollapse {
  const ctx = useContext(ProgramHeaderCollapseContext);
  if (!ctx) {
    throw new Error(
      "useProgramHeaderCollapse must be used within a ProgramHeaderCollapseProvider",
    );
  }
  return ctx;
}
