"use client";

import {
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownTrigger,
  useDropdown,
} from "@/src/components/portal/ui/Dropdown";
import { cn } from "@/src/lib/cn";

/** Compact single-select dropdown for a per-set control (variant, style) —
 * a trigger-only sibling of StyleSelect/CategoryCombobox's Dropdown-based
 * pattern, without the outer label row, so it fits inline in a dense set
 * row instead of a form field's usual full-width block. */
export function SetInlineSelect({
  options,
  value,
  onChange,
  noneLabel,
  allowNone = true,
  mutedValue,
  className,
}: {
  options: { id: string; name: string }[];
  /** "" selects `noneLabel`. */
  value: string;
  onChange: (id: string) => void;
  noneLabel: string;
  /** Whether `noneLabel` is itself a selectable list item (e.g. "No
   * style"), not just the trigger's unselected placeholder text. Variant
   * selects pass `false` — the base exercise is already one of `options`,
   * so a separate "No variant" entry would just be a second way to say
   * the same thing as picking it directly. */
  allowNone?: boolean;
  /** An option id whose trigger label renders muted/grey like the
   * unselected placeholder, even though it's a real selection — variant
   * selects pass the base exercise's id here, so picking it (the
   * "no variant" case) still visually reads as a default, not an explicit
   * choice. */
  mutedValue?: string;
  className?: string;
}) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const selectedLabel = options.find((o) => o.id === value)?.name ?? noneLabel;
  const isMuted = value === "" || value === mutedValue;

  return (
    <div className={cn("relative", className)}>
      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        <span className={cn(isMuted && "text-portal-text3")}>
          {selectedLabel}
        </span>
      </DropdownTrigger>
      {open && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <DropdownList>
            {allowNone && (
              <DropdownListItem
                variant="checkmark"
                label={noneLabel}
                selected={value === ""}
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              />
            )}
            {options.map((o) => (
              <DropdownListItem
                key={o.id}
                variant="checkmark"
                label={o.name}
                selected={value === o.id}
                onSelect={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              />
            ))}
          </DropdownList>
        </DropdownPanel>
      )}
    </div>
  );
}
