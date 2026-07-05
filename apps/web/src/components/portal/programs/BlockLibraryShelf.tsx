"use client";

import type { SessionTemplateSummary } from "@hooper/db";
import Link from "next/link";
import { useState } from "react";
import { singleBlockTemplates } from "./blockTemplateFilter";
import { DraggableBlockTemplateRow } from "./dnd/DraggableBlockTemplateRow";

interface BlockLibraryShelfProps {
  sessionTemplates: SessionTemplateSummary[];
}

function ShelfSidebar({
  search,
  onSearch,
  multiBlockCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  multiBlockCount: number;
}) {
  return (
    <div className="border-portal-border flex w-[180px] flex-shrink-0 flex-col gap-2 border-r p-2.5">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search…"
        className="border-portal-border bg-portal-bg text-portal-text1 h-7 w-full rounded-md border px-2 text-[11px] outline-none"
      />
      <p className="text-portal-text3 mt-auto text-[10px] leading-relaxed">
        Drag a block card up into any session above to add it.
        {multiBlockCount > 0 &&
          " Multi-block sessions come in via “+ Add session”."}
      </p>
      <Link
        href="/blocks"
        className="text-portal-orange text-[10px] font-semibold hover:underline">
        Manage Block Library →
      </Link>
    </div>
  );
}

/** The shelf's expandable content — mounted only while the containing
 * ProgramLibraryShelf toggle is open (see ProgramLibraryShelf.tsx, which
 * owns the shared open/collapsed + Exercises/Blocks tab chrome). */
export function BlockLibraryShelfBody({
  sessionTemplates,
}: BlockLibraryShelfProps) {
  const [search, setSearch] = useState("");
  const multiBlockCount = sessionTemplates.filter(
    (t) => t.blocks.length > 1,
  ).length;
  const filtered = singleBlockTemplates(sessionTemplates, search);

  return (
    <div className="flex h-[190px]">
      <ShelfSidebar
        search={search}
        onSearch={setSearch}
        multiBlockCount={multiBlockCount}
      />
      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto p-2.5">
        {filtered.length === 0 ? (
          <div className="text-portal-text3 px-2 py-6 text-center text-xs">
            No single-block templates yet
          </div>
        ) : (
          filtered.map((b) => (
            <DraggableBlockTemplateRow
              key={b.blockTemplateId}
              blockTemplateId={b.blockTemplateId}
              name={b.name}
              exerciseCount={b.exerciseCount}
              variant="card"
            />
          ))
        )}
      </div>
    </div>
  );
}
