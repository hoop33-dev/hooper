"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryTab } from "./LibraryTabs";

export interface UseLibraryPanelStateOptions {
  /** Distinct per page so the two search-input DOM ids never collide —
   * only one instance of this hook is ever mounted per page, but ids must
   * still be globally unique strings for document.getElementById. */
  idPrefix: string;
}

/**
 * Lifts the Exercises/Blocks library panel's tab, search, category filter,
 * and keyboard-selected-index state out of the leaf panel/shelf components
 * that used to own it privately — so the Shift+F/B/A keyboard shortcuts
 * (wired up in ProgramCanvasShell.tsx/SessionViewShell.tsx) can read and
 * drive it.
 */
export function useLibraryPanelState({
  idPrefix,
}: UseLibraryPanelStateOptions) {
  const [tab, setTabState] = useState<LibraryTab>("exercises");
  const [open, setOpen] = useState(true);
  const [exerciseSearch, setExerciseSearchState] = useState("");
  const [exerciseCategoryId, setExerciseCategoryIdState] = useState("");
  const [blockSearch, setBlockSearchState] = useState("");
  // null = no row is arrow-selected yet, so the highlight ring only appears
  // once the coach actually presses an arrow key — resets to null (not 0)
  // whenever the search/category/tab changes, so a fresh search never shows
  // a stale highlight.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const exerciseSearchInputId = `${idPrefix}-exercise-search`;
  const blockSearchInputId = `${idPrefix}-block-search`;

  function setTab(next: LibraryTab) {
    setTabState(next);
    setSelectedIndex(null);
  }

  function setExerciseSearch(next: string) {
    setExerciseSearchState(next);
    setSelectedIndex(null);
  }

  function setExerciseCategoryId(next: string) {
    setExerciseCategoryIdState(next);
    setSelectedIndex(null);
  }

  function setBlockSearch(next: string) {
    setBlockSearchState(next);
    setSelectedIndex(null);
  }

  // A tab switch unmounts/remounts the search input, so it can't be focused
  // synchronously in the same event handler that switches tabs — this ref
  // records the target and an effect (which runs after React commits the
  // new DOM) performs the actual focus. The tick counter, not just the
  // target tab, is the effect's dependency so re-pressing the same shortcut
  // while already on that tab still refocuses the input.
  const pendingFocusTabRef = useRef<LibraryTab | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    const target = pendingFocusTabRef.current;
    if (!target) return;
    pendingFocusTabRef.current = null;
    const id =
      target === "exercises" ? exerciseSearchInputId : blockSearchInputId;
    document.getElementById(id)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  function focusTab(target: LibraryTab) {
    setTab(target);
    setOpen(true);
    pendingFocusTabRef.current = target;
    setFocusTick((t) => t + 1);
  }

  return {
    tab,
    setTab,
    open,
    setOpen,
    exerciseSearch,
    setExerciseSearch,
    exerciseCategoryId,
    setExerciseCategoryId,
    blockSearch,
    setBlockSearch,
    selectedIndex,
    setSelectedIndex,
    exerciseSearchInputId,
    blockSearchInputId,
    focusExercises: () => focusTab("exercises"),
    focusBlocks: () => focusTab("blocks"),
  };
}
