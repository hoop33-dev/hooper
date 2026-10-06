"use client";

import { useEffect } from "react";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

interface ShortcutsModalProps {
  variant: "program" | "session";
  onClose: () => void;
}

interface ShortcutRow {
  keys: string;
  description: string;
  programOnly?: boolean;
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: "Shift F", description: "Focus the exercise search" },
  { keys: "Shift B", description: "Focus the block search" },
  {
    keys: "Shift E",
    description: "Collapse/expand the header and library panel",
    programOnly: true,
  },
  { keys: "Shift Q", description: "Add a new session", programOnly: true },
  { keys: "Shift W", description: "Add a new block" },
  {
    keys: "Shift A",
    description:
      "Add the selected exercise (or block template, on the Blocks tab)",
  },
  {
    keys: "← / →",
    description: "Move the selection while a library search is focused",
  },
];

export function ShortcutsModal({ variant, onClose }: ShortcutsModalProps) {
  const onBackdropClick = useModalDismiss(onClose);
  const rows = SHORTCUTS.filter((s) => !s.programOnly || variant === "program");

  // The help modal has no text input to steal focus, so without this the
  // global Shift+F/B/Q/W/A handler (see useLibraryShortcuts.ts) would still
  // fire underneath it — this suppresses those shortcuts for as long as the
  // modal stays mounted, with no coordination needed from the page shell.
  useEffect(() => {
    function suppress(e: KeyboardEvent) {
      if (e.shiftKey) e.stopPropagation();
    }
    document.addEventListener("keydown", suppress, true);
    return () => document.removeEventListener("keydown", suppress, true);
  }, []);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card w-full max-w-sm rounded-xl p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-title text-portal-text1 text-sm font-extrabold tracking-wide">
            Keyboard shortcuts
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="border-portal-border text-portal-text2 flex h-6 w-6 items-center justify-center rounded-full border">
            <XIcon size={9} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.keys}
              className="flex items-center justify-between gap-3">
              <span className="border-portal-border bg-portal-bg text-portal-text1 flex-shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold">
                {row.keys}
              </span>
              <span className="text-portal-text2 text-right text-xs">
                {row.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
