"use client";

export type LibraryTab = "exercises" | "blocks";

interface LibraryTabsProps {
  active: LibraryTab;
  onChange: (tab: LibraryTab) => void;
  className?: string;
}

export function LibraryTabs({ active, onChange, className }: LibraryTabsProps) {
  return (
    <div className={`flex gap-1 ${className ?? ""}`}>
      {(
        [
          ["exercises", "Exercises"],
          ["blocks", "Blocks"],
        ] as const
      ).map(([tab, label]) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`h-6 flex-1 rounded-md text-[11px] font-bold transition ${
            active === tab
              ? "bg-portal-orange text-white"
              : "text-portal-text3 hover:bg-portal-border/50"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}
