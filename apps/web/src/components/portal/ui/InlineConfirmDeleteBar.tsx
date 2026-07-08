"use client";

import { cn } from "@/src/lib/cn";
import { useState } from "react";
import { PortalButton } from "./PortalButton";
import { SpinnerIcon } from "./icons";

interface InlineConfirmDeleteBarProps {
  idleLabel: string;
  confirmLabel: string;
  onDelete: () => void;
  deleting?: boolean;
  className?: string;
}

/** A full-width danger-zone row. Idle and armed states share the same box,
 * height, and label style so asking for confirmation only reveals
 * Cancel/Delete on the right instead of resizing or re-styling the row. */
export function InlineConfirmDeleteBar({
  idleLabel,
  confirmLabel,
  onDelete,
  deleting = false,
  className,
}: InlineConfirmDeleteBarProps) {
  const [armed, setArmed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-9 items-center rounded-lg border border-red-200 bg-red-50 px-4",
        className,
      )}>
      {armed ? (
        <>
          <span className="flex-1 text-sm text-red-600">{confirmLabel}</span>
          <div className="flex items-center gap-3">
            <PortalButton
              variant="ghost"
              size="sm"
              onClick={() => setArmed(false)}
              disabled={deleting}>
              Cancel
            </PortalButton>
            <PortalButton
              variant="danger"
              size="sm"
              onClick={onDelete}
              disabled={deleting}>
              {deleting ? <SpinnerIcon size={12} /> : "Delete"}
            </PortalButton>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="flex-1 text-left text-sm font-medium text-red-600">
          {idleLabel}
        </button>
      )}
    </div>
  );
}
