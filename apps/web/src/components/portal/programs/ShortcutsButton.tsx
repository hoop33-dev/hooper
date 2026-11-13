"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { ShortcutsModal } from "./ShortcutsModal";

interface ShortcutsButtonProps {
  variant: "program" | "session";
}

/** Opens a popup listing the page's keyboard shortcuts (see
 * useLibraryShortcuts.ts) — placed to the left of the page title via
 * PageHeader's `leadingAction` slot. */
export function ShortcutsButton({ variant }: ShortcutsButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PortalButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}>
        Shortcuts
      </PortalButton>
      {open && (
        <ShortcutsModal variant={variant} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
