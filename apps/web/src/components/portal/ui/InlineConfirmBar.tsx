"use client";

import { cn } from "@/src/lib/cn";
import { useState } from "react";
import { SpinnerIcon } from "./icons";

type InlineConfirmBarTone = "danger" | "success";

interface InlineConfirmBarProps {
  idleLabel: string;
  confirmLabel: string;
  confirmActionLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  tone?: InlineConfirmBarTone;
  className?: string;
}

const toneClasses: Record<
  InlineConfirmBarTone,
  { box: string; label: string; action: string }
> = {
  danger: {
    box: "border-red-200 bg-red-50",
    label: "text-red-600",
    action:
      "border-red-500 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50",
  },
  success: {
    box: "border-green-200 bg-green-50",
    label: "text-green-700",
    action:
      "border-green-500 text-green-600 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50",
  },
};

/** A full-width confirm row. Idle and armed states share the same box,
 * height, and label style so asking for confirmation only reveals
 * Cancel/action on the right instead of resizing or re-styling the row. */
export function InlineConfirmBar({
  idleLabel,
  confirmLabel,
  confirmActionLabel = "Delete",
  onConfirm,
  loading = false,
  tone = "danger",
  className,
}: InlineConfirmBarProps) {
  const [armed, setArmed] = useState(false);
  const colors = toneClasses[tone];

  return (
    <div
      className={cn(
        "flex h-8 items-center rounded-lg border px-3",
        colors.box,
        className,
      )}>
      {armed ? (
        <>
          <span className={cn("flex-1 text-xs", colors.label)}>
            {confirmLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setArmed(false)}
              disabled={loading}
              className="text-portal-text2 hover:text-portal-text1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex items-center justify-center rounded border px-2 py-1 text-xs leading-none font-bold whitespace-nowrap",
                colors.action,
              )}>
              {loading ? <SpinnerIcon size={11} /> : confirmActionLabel}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className={cn("flex-1 text-left text-xs font-medium", colors.label)}>
          {idleLabel}
        </button>
      )}
    </div>
  );
}
