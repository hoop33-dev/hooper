"use client";

import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  SessionTemplateSummary,
} from "@hooper/db";
import { useState } from "react";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import { ExerciseLibraryPanel } from "./ExerciseLibraryPanel";
import { LibraryTabs, type LibraryTab } from "./LibraryTabs";

interface SessionLibrarySidebarProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates: SessionTemplateSummary[];
}

/** Swaps the session/program canvas's left panel between the Exercise
 * Library (drag an exercise into a block) and the Block Library (drag a
 * saved single-block template in as a whole new block). */
export function SessionLibrarySidebar({
  exercises,
  categories,
  sessionTemplates,
}: SessionLibrarySidebarProps) {
  const [tab, setTab] = useState<LibraryTab>("exercises");
  const tabs = (
    <LibraryTabs active={tab} onChange={setTab} className="flex-1" />
  );

  return tab === "exercises" ? (
    <ExerciseLibraryPanel
      exercises={exercises}
      categories={categories}
      tabs={tabs}
    />
  ) : (
    <BlockLibraryPanel sessionTemplates={sessionTemplates} tabs={tabs} />
  );
}
