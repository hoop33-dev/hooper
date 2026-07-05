"use client";

import type { SessionTemplateSummary } from "@hooper/db";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { singleBlockTemplates } from "./blockTemplateFilter";
import { DraggableBlockTemplateRow } from "./dnd/DraggableBlockTemplateRow";

interface BlockLibraryPanelProps {
  sessionTemplates: SessionTemplateSummary[];
  /** Replaces the plain "Block Library" title with the Exercises/Blocks tab
   * switcher (see ExerciseLibraryPanel's matching prop). */
  tabs?: ReactNode;
}

export function BlockLibraryPanel({
  sessionTemplates,
  tabs,
}: BlockLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const multiBlockCount = sessionTemplates.filter(
    (t) => t.blocks.length > 1,
  ).length;
  const filtered = singleBlockTemplates(sessionTemplates, search);

  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border border-b px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {tabs ?? (
            <span className="text-portal-text3 text-[11px] font-bold tracking-wide uppercase">
              Block Library
            </span>
          )}
          <span className="text-portal-text3 text-[11px]">
            {filtered.length}
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks…"
          className="border-portal-border bg-portal-bg text-portal-text1 focus:border-portal-orange h-8 w-full rounded-lg border px-2.5 text-xs outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-portal-text3 px-3.5 py-6 text-center text-xs">
            No single-block templates yet
          </div>
        ) : (
          filtered.map((b) => (
            <DraggableBlockTemplateRow
              key={b.blockTemplateId}
              blockTemplateId={b.blockTemplateId}
              name={b.name}
              exerciseCount={b.exerciseCount}
            />
          ))
        )}
      </div>
      <div className="border-portal-border text-portal-text3 border-t px-3.5 py-2.5 text-[10px] leading-relaxed">
        Drag a block up to add it here.{" "}
        {multiBlockCount > 0 && (
          <>Multi-block sessions come in via &ldquo;+ Add session&rdquo;. </>
        )}
        <Link href="/blocks" className="text-portal-orange hover:underline">
          Manage Block Library →
        </Link>
      </div>
    </div>
  );
}
