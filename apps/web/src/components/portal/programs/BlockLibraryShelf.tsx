"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { LibraryTemplate } from "./blockTemplateFilter";
import { DraggableBlockTemplateRow } from "./dnd/DraggableBlockTemplateRow";
import { handleLibrarySearchKeyDown } from "./librarySearchKeyboardNav";

interface BlockLibraryShelfProps {
  /** Pre-filtered by the shell (ProgramCanvasShell) from `search`, so what's
   * rendered always matches what Shift+A targets. */
  items: LibraryTemplate[];
  search: string;
  onSearchChange: (v: string) => void;
  searchInputId: string;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onQuickAdd: () => void;
}

function ShelfSidebar({
  search,
  onSearch,
  onSearchKeyDown,
  searchInputId,
}: {
  search: string;
  onSearch: (v: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchInputId: string;
}) {
  return (
    <div className="border-portal-border flex w-[180px] flex-shrink-0 flex-col gap-2 border-r p-2.5">
      <input
        id={searchInputId}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={onSearchKeyDown}
        placeholder="Search…"
        className="border-portal-border bg-portal-bg text-portal-text1 h-7 w-full rounded-md border px-2 text-[11px] outline-none"
      />
      <p className="text-portal-text3 mt-auto text-[10px] leading-relaxed">
        Drag a card up into any session above to add it.
      </p>
      <AppLink
        href="/blocks"
        className="text-portal-orange text-[10px] font-semibold hover:underline">
        Manage Block Library →
      </AppLink>
    </div>
  );
}

/** The shelf's expandable content — mounted only while the containing
 * ProgramLibraryShelf toggle is open (see ProgramLibraryShelf.tsx, which
 * owns the shared open/collapsed + Exercises/Blocks tab chrome). */
export function BlockLibraryShelfBody({
  items,
  search,
  onSearchChange,
  searchInputId,
  selectedIndex,
  onSelectedIndexChange,
  onQuickAdd,
}: BlockLibraryShelfProps) {
  return (
    <div className="flex h-[170px]">
      <ShelfSidebar
        search={search}
        onSearch={onSearchChange}
        onSearchKeyDown={(e) =>
          handleLibrarySearchKeyDown(e, {
            itemCount: items.length,
            selectedIndex,
            onSelectedIndexChange,
            onQuickAdd,
          })
        }
        searchInputId={searchInputId}
      />
      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto p-2.5">
        {items.length === 0 ? (
          <div className="text-portal-text3 px-2 py-6 text-center text-xs">
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
              variant="card"
              isSelected={index === selectedIndex}
            />
          ))
        )}
      </div>
    </div>
  );
}
