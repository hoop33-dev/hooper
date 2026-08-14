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
import type { ExerciseStyleRow } from "@hooper/db";
import { useState } from "react";

interface StyleSelectProps {
  styles: ExerciseStyleRow[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  createStyleAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseStyleRow; error?: string }>;
  profileId?: string;
  onStyleCreated?: (style: ExerciseStyleRow) => void;
}

export function StyleSelect({
  styles,
  value,
  onChange,
  label = "Default style",
  createStyleAction,
  profileId,
  onStyleCreated,
}: StyleSelectProps) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");

  async function createStyle(name: string) {
    if (!createStyleAction || !profileId) return;
    const result = await createStyleAction({ name, created_by: profileId });
    if (result.ok && result.data) {
      onStyleCreated?.(result.data);
      onChange(result.data.id);
    }
    return result;
  }

  const selectedName = styles.find((s) => s.id === value)?.name ?? "None";
  const query = search.toLowerCase();
  const showNone = "none".includes(query);
  const filteredStyles = styles.filter((s) =>
    s.name.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-portal-text2 text-xs font-semibold">
        {label}{" "}
        <span className="text-portal-text3 font-normal">(optional)</span>
      </label>

      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        {selectedName}
      </DropdownTrigger>

      {open && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <DropdownSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search styles…"
          />
          <DropdownList>
            {showNone && (
              <DropdownListItem
                variant="checkmark"
                label="None"
                selected={value === ""}
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              />
            )}
            {filteredStyles.map((style) => (
              <DropdownListItem
                key={style.id}
                variant="checkmark"
                label={style.name}
                selected={value === style.id}
                onSelect={() => {
                  onChange(style.id);
                  setOpen(false);
                }}
              />
            ))}
          </DropdownList>
          {createStyleAction && profileId && (
            <div className="border-portal-border border-t">
              <DropdownAddRow itemLabel="style" onCreate={createStyle} />
            </div>
          )}
        </DropdownPanel>
      )}
    </div>
  );
}
