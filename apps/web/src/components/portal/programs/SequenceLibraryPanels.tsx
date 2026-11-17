"use client";

import type { LibrarySequenceWithDetails } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";
import type { ReactNode } from "react";
import { matchesSearch } from "../ui/ListToolbar";
import { DraggableSequenceRow } from "./dnd/DraggableSequenceRow";
import { handleLibrarySearchKeyDown } from "./librarySearchKeyboardNav";

export function filterSequences(
  sequences: LibrarySequenceWithDetails[],
  search: string,
): LibrarySequenceWithDetails[] {
  return sequences.filter((s) => matchesSearch(search, s.name, s.description));
}

interface SequenceLibraryProps {
  /** Pre-filtered by the shell, so what's rendered matches Shift+A. */
  items: LibrarySequenceWithDetails[];
  search: string;
  onSearchChange: (v: string) => void;
  searchInputId: string;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onQuickAdd: () => void;
}

function EmptyNote({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-portal-text3 px-3.5 py-6 text-center text-xs">
      {hasSearch ? "No sequences match your search" : "No sequences yet"}
    </div>
  );
}

/** The program shelf's Sequences tab. */
export function SequenceLibraryShelfBody({
  items,
  search,
  onSearchChange,
  searchInputId,
  selectedIndex,
  onSelectedIndexChange,
  onQuickAdd,
}: SequenceLibraryProps) {
  return (
    <div className="flex h-[170px]">
      <div className="border-portal-border flex w-[180px] flex-shrink-0 flex-col gap-2 border-r p-2.5">
        <input
          id={searchInputId}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) =>
            handleLibrarySearchKeyDown(e, {
              itemCount: items.length,
              selectedIndex,
              onSelectedIndexChange,
              onQuickAdd,
            })
          }
          placeholder="Search…"
          className="border-portal-border bg-portal-bg text-portal-text1 h-7 w-full rounded-md border px-2 text-[11px] outline-none"
        />
        <p className="text-portal-text3 mt-auto text-[10px] leading-relaxed">
          Drag a card up into any block above to add a copy.
        </p>
        <AppLink
          href="/sequences"
          className="text-portal-orange text-[10px] font-semibold hover:underline">
          Manage Sequences →
        </AppLink>
      </div>
      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-x-hidden overflow-y-auto p-2.5">
        {items.length === 0 ? (
          <EmptyNote hasSearch={!!search} />
        ) : (
          items.map((sequence, index) => (
            <DraggableSequenceRow
              key={sequence.id}
              sequence={sequence}
              variant="card"
              isSelected={index === selectedIndex}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** The session editor sidebar's Sequences tab. */
export function SequenceLibraryPanel({
  tabs,
  items,
  search,
  onSearchChange,
  searchInputId,
  selectedIndex,
  onSelectedIndexChange,
  onQuickAdd,
}: SequenceLibraryProps & { tabs: ReactNode }) {
  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border border-b px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {tabs}
          <span className="text-portal-text3 text-[11px]">{items.length}</span>
        </div>
        <input
          id={searchInputId}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) =>
            handleLibrarySearchKeyDown(e, {
              itemCount: items.length,
              selectedIndex,
              onSelectedIndexChange,
              onQuickAdd,
            })
          }
          placeholder="Search sequences…"
          className="border-portal-border bg-portal-bg text-portal-text1 focus:border-portal-orange h-8 w-full rounded-lg border px-2.5 text-xs outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyNote hasSearch={!!search} />
        ) : (
          items.map((sequence, index) => (
            <DraggableSequenceRow
              key={sequence.id}
              sequence={sequence}
              isSelected={index === selectedIndex}
            />
          ))
        )}
      </div>
      <div className="border-portal-border text-portal-text3 border-t px-3.5 py-2.5 text-[10px] leading-relaxed">
        Drag a sequence into a block to add a copy.{" "}
        <AppLink
          href="/sequences"
          className="text-portal-orange hover:underline">
          Manage Sequences →
        </AppLink>
      </div>
    </div>
  );
}
