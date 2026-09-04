"use client";

import { cn } from "@/src/lib/cn";

/** Labeled pill switch — label to the left, track to the right. */
export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex flex-shrink-0 items-center gap-2">
      <span className="text-portal-text2 text-xs font-semibold whitespace-nowrap">
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
