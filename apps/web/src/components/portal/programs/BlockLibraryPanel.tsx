"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LibraryTemplate } from "./blockTemplateFilter";
import { DraggableBlockTemplateRow } from "./dnd/DraggableBlockTemplateRow";
import { handleLibrarySearchKeyDown } from "./librarySearchKeyboardNav";

interface BlockLibraryPanelProps {
  /** Replaces the plain "Block Library" title with the Exercises/Blocks tab
   * switcher (see ExerciseLibraryPanel's matching prop). */
  tabs?: ReactNode;
  /** Pre-filtered by the shell (SessionViewShell) from `search`, so what's
   * rendered always matches what Shift+A targets. */
  items: LibraryTemplate[];
  search: string;
  onSearchChange: (v: string) => void;
  searchInputId: string;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onQuickAdd: () => void;
}

export function BlockLibraryPanel({
  tabs,
  items,
  search,
  onSearchChange,
  searchInputId,
  selectedIndex,
  onSelectedIndexChange,
  onQuickAdd,
}: BlockLibraryPanelProps) {
  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border border-b px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {tabs ?? (
            <span className="text-portal-text3 text-[11px] font-bold tracking-wide uppercase">
              Block Library
            </span>
          )}
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
          placeholder="Search blocks…"
          className="border-portal-border bg-portal-bg text-portal-text1 focus:border-portal-orange h-8 w-full rounded-lg border px-2.5 text-xs outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-portal-text3 px-3.5 py-6 text-center text-xs">
            No block templates yet
          </div>
        ) : (
          items.map((b, index) => (
            <DraggableBlockTemplateRow
              key={b.dragId}
              dragId={b.dragId}
              name={b.name}
              exerciseCount={b.exerciseCount}
              blockCount={b.blockCount}
              isSelected={index === selectedIndex}
            />
          ))
        )}
      </div>
      <div className="border-portal-border text-portal-text3 border-t px-3.5 py-2.5 text-[10px] leading-relaxed">
        Drag a template up to add it here.{" "}
        <Link href="/blocks" className="text-portal-orange hover:underline">
          Manage Block Library →
        </Link>
      </div>
    </div>
  );
}
