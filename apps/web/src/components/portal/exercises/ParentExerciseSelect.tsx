"use client";

import {
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownSearchInput,
  DropdownTrigger,
  useDropdown,
} from "@/src/components/portal/ui/Dropdown";
import type { ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";

interface ParentExerciseSelectProps {
  baseExercises: ExerciseWithDetails[];
  value: string;
  onChange: (id: string) => void;
  /** True when the exercise being edited already has variants pointing at
   * it — a base exercise with children can't itself become a variant
   * (single-level nesting only). */
  disabled?: boolean;
  locked?: boolean;
}

export function ParentExerciseSelect({
  baseExercises,
  value,
  onChange,
  disabled,
  locked,
}: ParentExerciseSelectProps) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");
  const isDisabled = disabled || locked;

  const selectedName =
    baseExercises.find((ex) => ex.id === value)?.name ?? "None (base exercise)";
  const query = search.toLowerCase();
  const showNone = "none".includes(query) || "base exercise".includes(query);
  const filteredExercises = baseExercises.filter((ex) =>
    ex.name.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-portal-text2 text-xs font-semibold">
        Variant of{" "}
        <span className="text-portal-text3 font-normal">(optional)</span>
      </label>

      <DropdownTrigger
        anchorRef={anchorRef}
        onClick={() => setOpen((o) => !o)}
        disabled={isDisabled}>
        {selectedName}
      </DropdownTrigger>

      {open && !isDisabled && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <DropdownSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search exercises…"
          />
          <DropdownList>
            {showNone && (
              <DropdownListItem
                variant="checkmark"
                label="None (base exercise)"
                selected={value === ""}
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              />
            )}
            {filteredExercises.map((ex) => (
              <DropdownListItem
                key={ex.id}
                variant="checkmark"
                label={ex.name}
                selected={value === ex.id}
                onSelect={() => {
                  onChange(ex.id);
                  setOpen(false);
                }}
              />
            ))}
          </DropdownList>
        </DropdownPanel>
      )}

      {disabled && !locked && (
        <p className="text-portal-text3 text-xs">
          This exercise already has variants, so it can&apos;t become a variant
          itself.
        </p>
      )}
    </div>
  );
}
