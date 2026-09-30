"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PlusIcon } from "../ui/icons";
import { matchesSearch } from "../ui/ListToolbar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { PackageModal } from "./PackageAtoms";

export type PackagePickItem = {
  id: string;
  title: string;
  sub?: string;
  lead: ReactNode;
};

/** Single-pick list for adding a program or coach to a package — picking a
 * row adds it and closes, as in the design. Only unattached items are
 * passed in. */
export function AddPackageItemModal({
  title,
  packageName,
  items,
  emptyLabel,
  searchPlaceholder,
  onPick,
  onClose,
}: {
  title: string;
  packageName: string;
  items: PackagePickItem[];
  emptyLabel: string;
  searchPlaceholder: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((item) =>
    matchesSearch(search, item.title, item.sub),
  );

  return (
    <PackageModal title={title} subtitle={packageName} onClose={onClose}>
      {items.length > 0 && (
        <div className="border-portal-border border-b px-6 py-3">
          <PortalInput
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
      <div className="max-h-[340px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-portal-text3 px-6 py-8 text-center text-[13px]">
            {emptyLabel}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-portal-text3 px-6 py-8 text-center text-[13px]">
            No matches
          </p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onPick(item.id);
                onClose();
              }}
              className="border-portal-border hover:bg-portal-bg flex w-full cursor-pointer items-center gap-3.5 border-b px-6 py-3.5 text-left">
              {item.lead}
              <div className="min-w-0 flex-1">
                <div className="text-portal-text1 truncate text-[13px] font-bold">
                  {item.title}
                </div>
                {item.sub && (
                  <div className="text-portal-text3 mt-0.5 text-[11px]">
                    {item.sub}
                  </div>
                )}
              </div>
              <span className="bg-portal-orange-soft text-portal-orange flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border border-[rgba(241,88,37,0.22)]">
                <PlusIcon size={12} />
              </span>
            </button>
          ))
        )}
      </div>
      <div className="border-portal-border flex justify-end border-t px-6 py-4">
        <PortalButton onClick={onClose}>Cancel</PortalButton>
      </div>
    </PackageModal>
  );
}
