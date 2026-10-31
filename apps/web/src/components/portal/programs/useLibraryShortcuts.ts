"use client";

import { useEffect, useRef } from "react";
import { isTextInput } from "../ui/useModalDismiss";

export interface UseLibraryShortcutsOptions {
  /** Shortcuts are inert while any modal on the page is open. */
  isModalOpen: boolean;
  onFocusExercises: () => void;
  onFocusBlocks: () => void;
  /** Absent in the session editor, which only ever has one session — Shift+Q
   * simply falls through as unhandled when this is omitted. */
  onAddSession?: () => void;
  onAddBlock: () => void;
  onAddSelected: () => void;
  /** Shift+E — collapses/expands the program-week editor's header band and
   * library panel together (see ProgramCanvasShell for the "collapse both
   * first when their states disagree" rule). Absent in the session editor,
   * which has neither toggle; Shift+E simply falls through there. */
  onToggleCollapseAll?: () => void;
}

/**
 * Program/session editor keyboard shortcuts: Shift+F/B focus the library
 * search, Shift+Q opens the new-session modal, Shift+W adds a block, Shift+A
 * quick-adds the currently selected library item, Shift+E collapses/expands
 * the header band and library panel together. Follows the same
 * `document.addEventListener("keydown", ...)` + `isTextInput` guard pattern
 * as useModalDismiss.ts — while focus is in the exercise/block search input
 * (a text input), this handler is inert and only that input's own local
 * onKeyDown (see librarySearchKeyboardNav.ts) reacts to Shift+A/arrows, so
 * the two never double-fire.
 */
export function useLibraryShortcuts(options: UseLibraryShortcutsOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      const opts = optionsRef.current;
      if (opts.isModalOpen || isTextInput(document.activeElement)) return;
      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          opts.onFocusExercises();
          break;
        case "b":
          e.preventDefault();
          opts.onFocusBlocks();
          break;
        case "q":
          if (!opts.onAddSession) return;
          e.preventDefault();
          opts.onAddSession();
          break;
        case "w":
          e.preventDefault();
          opts.onAddBlock();
          break;
        case "a":
          e.preventDefault();
          opts.onAddSelected();
          break;
        case "e":
          if (!opts.onToggleCollapseAll) return;
          e.preventDefault();
          opts.onToggleCollapseAll();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
