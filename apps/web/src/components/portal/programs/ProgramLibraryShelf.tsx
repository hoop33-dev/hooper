"use client";

import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  SessionTemplateSummary,
} from "@hooper/db";
import { useState } from "react";
import { BlockLibraryShelfBody } from "./BlockLibraryShelf";
import { ExerciseLibraryShelfBody } from "./ExerciseLibraryShelf";
import { LibraryTabs, type LibraryTab } from "./LibraryTabs";

interface ProgramLibraryShelfProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates: SessionTemplateSummary[];
}

export function ProgramLibraryShelf({
  exercises,
  categories,
  sessionTemplates,
}: ProgramLibraryShelfProps) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<LibraryTab>("exercises");

  return (
    <div className="bg-portal-card flex-shrink-0">
      <div className="border-portal-border flex h-9 w-full flex-shrink-0 items-center gap-3 border-t px-4">
        <LibraryTabs
          active={tab}
          onChange={(t) => {
            setTab(t);
            setOpen(true);
          }}
          className="w-40 flex-shrink-0"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-portal-text3 ml-auto text-[10px] font-semibold">
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open && (
        <div className="border-portal-border border-t">
          {tab === "exercises" ? (
            <ExerciseLibraryShelfBody
              exercises={exercises}
              categories={categories}
            />
          ) : (
            <BlockLibraryShelfBody sessionTemplates={sessionTemplates} />
          )}
        </div>
      )}
    </div>
  );
}
