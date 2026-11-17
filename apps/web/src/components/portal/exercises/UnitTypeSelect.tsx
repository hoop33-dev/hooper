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
import { cn } from "@/src/lib/cn";
import type { UnitTypeRow } from "@hooper/db";
import { useState, type RefObject } from "react";

const MAX_UNIT_TYPES = 3;

interface UnitTypeSelectProps {
  unitTypes: UnitTypeRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
  createUnitTypeAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: UnitTypeRow; error?: string }>;
  profileId?: string;
  onUnitTypeCreated?: (unitType: UnitTypeRow) => void;
}

function SelectedUnitTypeChips({
  selectedNames,
  selectedIds,
  onRemove,
}: {
  selectedNames: string[];
  selectedIds: string[];
  onRemove: (id: string) => void;
}) {
  if (selectedNames.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedNames.map((name, i) => (
        <span
          key={selectedIds[i]}
          className="bg-portal-orange-soft text-portal-orange inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
          {name}
          <button
            type="button"
            onClick={() => onRemove(selectedIds[i])}
            className="ml-0.5 rounded-full hover:opacity-70">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function UnitTypeDropdown({
  anchorRef,
  panelRef,
  unitTypes,
  selected,
  search,
  onSearchChange,
  onToggle,
  onCreateUnitType,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  unitTypes: UnitTypeRow[];
  selected: string[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (id: string) => void;
  onCreateUnitType?: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string } | undefined>;
}) {
  const filteredUnitTypes = unitTypes.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
      <DropdownSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search unit types…"
      />
      <p className="text-portal-text3 border-portal-border border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
        Up to {MAX_UNIT_TYPES} unit types
      </p>
      <DropdownList>
        {filteredUnitTypes.map((unitType) => {
          const isSelected = selected.includes(unitType.id);
          const isDisabled = !isSelected && selected.length >= MAX_UNIT_TYPES;
          return (
            <div
              key={unitType.id}
              className={cn(isDisabled && "pointer-events-none opacity-40")}>
              <DropdownListItem
                variant="checkbox"
                label={unitType.name}
                selected={isSelected}
                onSelect={() => onToggle(unitType.id)}
              />
            </div>
          );
        })}
      </DropdownList>
      {onCreateUnitType && (
        <div className="border-portal-border border-t">
          <DropdownAddRow itemLabel="unit type" onCreate={onCreateUnitType} />
        </div>
      )}
    </DropdownPanel>
  );
}

export function UnitTypeSelect({
  unitTypes,
  selected,
  onChange,
  createUnitTypeAction,
  profileId,
  onUnitTypeCreated,
}: UnitTypeSelectProps) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_UNIT_TYPES) {
      onChange([...selected, id]);
    }
  }

  async function createUnitType(name: string) {
    if (!createUnitTypeAction || !profileId) return;
    const result = await createUnitTypeAction({ name, created_by: profileId });
    if (result.ok && result.data) {
      onUnitTypeCreated?.(result.data);
      if (selected.length < MAX_UNIT_TYPES) {
        onChange([...selected, result.data.id]);
      }
    }
    return result;
  }

  const selectedNames = selected
    .map((id) => unitTypes.find((u) => u.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-1">
      <label className="text-portal-text2 text-xs font-semibold">
        Default unit types{" "}
        <span className="text-portal-text3 font-normal">(select up to 3)</span>
      </label>

      <SelectedUnitTypeChips
        selectedNames={selectedNames}
        selectedIds={selected}
        onRemove={toggle}
      />

      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        {selectedNames.length > 0
          ? `${selectedNames.length} selected`
          : "Select unit types…"}
      </DropdownTrigger>

      {open && (
        <UnitTypeDropdown
          anchorRef={anchorRef}
          panelRef={panelRef}
          unitTypes={unitTypes}
          selected={selected}
          search={search}
          onSearchChange={setSearch}
          onToggle={toggle}
          onCreateUnitType={
            createUnitTypeAction && profileId ? createUnitType : undefined
          }
        />
      )}
    </div>
  );
}
