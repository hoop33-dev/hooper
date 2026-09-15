"use client";

import {
  DropdownAddRow,
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownSearchInput,
  DropdownTrigger,
  useDropdown,
} from "@/src/components/portal/ui/Dropdown";
import { sortUnitTypes } from "@/src/constants/unitTypes";
import { cn } from "@/src/lib/cn";
import type { UnitTypeRow } from "@hooper/db";
import { useState } from "react";

const MAX_UNITS = 3;

/** A single set's own unit-type multi-select — up to 3, independently of
 * every other set's choice (unlike the exercise library's UnitTypeSelect,
 * which sets the exercise's shared *default* combo). Checkbox-style,
 * built on the same Dropdown primitives as StyleSelect/CategoryCombobox so
 * it can show checkmarks/checkboxes, which a native <select> can't. Options
 * come from the unit_types catalog rather than the old hardcoded UNIT_TYPES
 * constant, and `selected`/`onChange` still traffic in plain names — the
 * placement's own block_exercise_measurements.unit_type column stays free
 * text (see plan §7). */
export function SetUnitTypeSelect({
  unitTypes,
  selected,
  onChange,
  createUnitTypeAction,
  profileId,
  className,
}: {
  unitTypes: UnitTypeRow[];
  selected: string[];
  onChange: (unitTypes: string[]) => void;
  createUnitTypeAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: UnitTypeRow; error?: string }>;
  profileId?: string;
  className?: string;
}) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");
  const [extraUnitTypes, setExtraUnitTypes] = useState<UnitTypeRow[]>([]);
  // extraUnitTypes is optimistic local state for a type created inline
  // before this component re-renders with a `unitTypes` prop that includes
  // it (e.g. once the page's server data next refreshes) — filter out
  // anything the prop has since caught up with so the same id never ends up
  // in the list (and as a .map() key) twice.
  const knownIds = new Set(unitTypes.map((u) => u.id));
  const allUnitTypes =
    extraUnitTypes.length > 0
      ? [...unitTypes, ...extraUnitTypes.filter((u) => !knownIds.has(u.id))]
      : unitTypes;

  function toggle(unit: string) {
    if (selected.includes(unit)) {
      onChange(selected.filter((u) => u !== unit));
    } else if (selected.length < MAX_UNITS) {
      onChange(sortUnitTypes([...selected, unit]));
    }
  }

  async function createUnitType(name: string) {
    if (!createUnitTypeAction || !profileId) return;
    const result = await createUnitTypeAction({ name, created_by: profileId });
    if (result.ok && result.data) {
      setExtraUnitTypes((prev) => [...prev, result.data!]);
      if (selected.length < MAX_UNITS) {
        onChange(sortUnitTypes([...selected, result.data.name]));
      }
    }
    return result;
  }

  const label = selected.length > 0 ? selected.join(" + ") : "Select units";
  const filteredUnitTypes = allUnitTypes.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={cn("relative", className)}>
      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        <span className={cn(selected.length === 0 && "text-portal-text3")}>
          {label}
        </span>
      </DropdownTrigger>
      {open && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <DropdownSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search unit types…"
          />
          <p className="text-portal-text3 border-portal-border border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
            Up to {MAX_UNITS} units
          </p>
          <DropdownList>
            {filteredUnitTypes.map((unit) => {
              const isSelected = selected.includes(unit.name);
              const isDisabled = !isSelected && selected.length >= MAX_UNITS;
              return (
                <div
                  key={unit.id}
                  className={cn(
                    isDisabled && "pointer-events-none opacity-40",
                  )}>
                  <DropdownListItem
                    variant="checkbox"
                    label={unit.name}
                    selected={isSelected}
                    onSelect={() => toggle(unit.name)}
                  />
                </div>
              );
            })}
          </DropdownList>
          {createUnitTypeAction && profileId && (
            <div className="border-portal-border border-t">
              <DropdownAddRow itemLabel="unit type" onCreate={createUnitType} />
            </div>
          )}
        </DropdownPanel>
      )}
    </div>
  );
}
