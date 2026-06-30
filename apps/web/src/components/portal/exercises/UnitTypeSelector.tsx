"use client";

import { UNIT_TYPES } from "@/src/constants/unitTypes";
import type { UnitType } from "@/src/constants/unitTypes";
import { cn } from "@/src/lib/cn";

interface UnitTypeSelectorProps {
  selected: UnitType[];
  onChange: (selected: UnitType[]) => void;
}

export function UnitTypeSelector({ selected, onChange }: UnitTypeSelectorProps) {
  function toggle(unit: UnitType) {
    if (selected.includes(unit)) {
      onChange(selected.filter((u) => u !== unit));
    } else if (selected.length < 3) {
      onChange([...selected, unit]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-portal-text2">
        Default unit types{" "}
        <span className="font-normal text-portal-text3">(select up to 3)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {UNIT_TYPES.map((unit) => {
          const isSelected = selected.includes(unit);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <button
              key={unit}
              type="button"
              onClick={() => toggle(unit)}
              disabled={isDisabled}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                isSelected
                  ? "bg-portal-orange text-white"
                  : "border border-portal-border bg-portal-card text-portal-text2 hover:border-portal-orange hover:text-portal-orange",
                isDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              {unit}
            </button>
          );
        })}
      </div>
    </div>
  );
}
