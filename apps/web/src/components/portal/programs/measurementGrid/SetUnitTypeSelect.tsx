"use client";

import {
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownTrigger,
  useDropdown,
} from "@/src/components/portal/ui/Dropdown";
import { UNIT_TYPES, sortUnitTypes } from "@/src/constants/unitTypes";
import { cn } from "@/src/lib/cn";

const MAX_UNITS = 3;

/** A single set's own unit-type multi-select — up to 3, independently of
 * every other set's choice (unlike the exercise library's UnitTypeSelector,
 * which sets the exercise's shared *default* combo). Checkbox-style,
 * built on the same Dropdown primitives as StyleSelect/CategoryCombobox so
 * it can show checkmarks/checkboxes, which a native <select> can't. */
export function SetUnitTypeSelect({
  selected,
  onChange,
  className,
}: {
  selected: string[];
  onChange: (unitTypes: string[]) => void;
  className?: string;
}) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();

  function toggle(unit: string) {
    if (selected.includes(unit)) {
      onChange(selected.filter((u) => u !== unit));
    } else if (selected.length < MAX_UNITS) {
      onChange(sortUnitTypes([...selected, unit]));
    }
  }

  const label = selected.length > 0 ? selected.join(" + ") : "Select units";

  return (
    <div className={cn("relative", className)}>
      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        <span className={cn(selected.length === 0 && "text-portal-text3")}>
          {label}
        </span>
      </DropdownTrigger>
      {open && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <p className="text-portal-text3 border-portal-border border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
            Up to {MAX_UNITS} units
          </p>
          <DropdownList>
            {UNIT_TYPES.map((unit) => {
              const isSelected = selected.includes(unit);
              const isDisabled = !isSelected && selected.length >= MAX_UNITS;
              return (
                <div
                  key={unit}
                  className={cn(
                    isDisabled && "pointer-events-none opacity-40",
                  )}>
                  <DropdownListItem
                    variant="checkbox"
                    label={unit}
                    selected={isSelected}
                    onSelect={() => toggle(unit)}
                  />
                </div>
              );
            })}
          </DropdownList>
        </DropdownPanel>
      )}
    </div>
  );
}
