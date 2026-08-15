"use client";

import { cn } from "@/src/lib/cn";
import type { UnitTypeRow } from "@hooper/db";

interface UnitTypeSidebarProps {
  unitTypes: UnitTypeRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function UnitTypeSidebar({
  unitTypes,
  selectedId,
  onSelect,
  onCreate,
}: UnitTypeSidebarProps) {
  return (
    <aside className="border-portal-border bg-portal-card flex w-[260px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border flex flex-shrink-0 items-center justify-between border-b px-5 py-4">
        <span className="text-portal-text1 text-sm font-bold">
          Unit types
        </span>
        <button
          type="button"
          onClick={onCreate}
          className="bg-portal-orange flex h-7 w-7 items-center justify-center rounded-lg text-white hover:brightness-110"
          title="Create unit type">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5">
        {unitTypes.length === 0 ? (
          <p className="text-portal-text3 px-2 pt-4 text-center text-xs">
            No unit types yet.{" "}
            <button
              type="button"
              onClick={onCreate}
              className="text-portal-orange hover:underline">
              Create one
            </button>
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {unitTypes.map((unitType) => (
              <button
                key={unitType.id}
                type="button"
                onClick={() => onSelect(unitType.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm transition",
                  selectedId === unitType.id
                    ? "bg-portal-orange-soft text-portal-orange font-semibold"
                    : "text-portal-text1 hover:bg-portal-bg",
                )}>
                {unitType.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
