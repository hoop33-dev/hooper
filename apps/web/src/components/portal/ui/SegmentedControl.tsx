"use client";

import { cn } from "@/src/lib/cn";

/** Pill-style single choice: equal-width segments in a sunken track, the
 * selected one raised. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-[3px]">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "flex-1 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold",
            value === v
              ? "border-portal-border bg-portal-card text-portal-text1"
              : "text-portal-text3 border-transparent",
          )}>
          {label}
        </button>
      ))}
    </div>
  );
}
