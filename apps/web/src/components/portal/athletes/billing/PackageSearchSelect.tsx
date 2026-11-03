"use client";

import { formatPackagePrice, type PackagePricing } from "@/src/lib/packages";
import { useState } from "react";
import {
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownSearchInput,
  DropdownTrigger,
  useDropdown,
} from "../../ui/Dropdown";
import { matchesSearch } from "../../ui/ListToolbar";

export type PackageOption = PackagePricing & { id: string; name: string };

function optionSub(p: PackageOption): string {
  return `${p.billing_type === "recurring" ? "Recurring" : "One-off"}, ${formatPackagePrice(p)}`;
}

/** Single-select package picker with search, for the change-package modal.
 * The selected package shows its price under the name. */
export function PackageSearchSelect({
  packages,
  value,
  onChange,
}: {
  packages: PackageOption[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");
  const selected = packages.find((p) => p.id === value);
  const shown = packages.filter((p) => matchesSearch(search, p.name));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-portal-text3 text-[11px] font-semibold tracking-widest uppercase">
        Package
      </span>
      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        {selected ? (
          <span>
            <span className="text-portal-text1 font-semibold">
              {selected.name}
            </span>
            <span className="text-portal-text3">
              {" "}
              · {formatPackagePrice(selected)}
            </span>
          </span>
        ) : (
          <span className="text-portal-text3">
            Search {packages.length} packages
          </span>
        )}
      </DropdownTrigger>
      {open && (
        <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
          <DropdownSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search packages…"
          />
          <DropdownList>
            {shown.length === 0 ? (
              <p className="text-portal-text3 px-3 py-3 text-[13px]">
                {packages.length === 0
                  ? "No other packages to add."
                  : `No packages match “${search}”.`}
              </p>
            ) : (
              shown.map((p) => (
                <DropdownListItem
                  key={p.id}
                  variant="checkmark"
                  label={p.name}
                  sub={optionSub(p)}
                  selected={p.id === value}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                    setSearch("");
                  }}
                />
              ))
            )}
          </DropdownList>
        </DropdownPanel>
      )}
    </div>
  );
}
