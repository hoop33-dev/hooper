"use client";

import { cn } from "@/src/lib/cn";

/** Labeled pill switch — label to the left, track to the right.
 * `hideLabel` keeps the label for screen readers only, for a switch whose
 * meaning the surrounding heading already shows. */
export function ToggleSwitch({
  label,
  checked,
  onChange,
  hideLabel = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex flex-shrink-0 items-center gap-2">
      <span
        className={cn(
          "text-portal-text2 text-xs font-semibold whitespace-nowrap",
          hideLabel && "sr-only",
        )}>
        {label}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors",
          checked ? "bg-portal-orange" : "bg-portal-border",
        )}>
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
