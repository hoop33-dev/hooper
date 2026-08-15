"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import type { LibraryTemplate } from "./blockTemplateFilter";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { ExerciseLibraryPanel } from "./ExerciseLibraryPanel";
import { LibraryTabs } from "./LibraryTabs";
import type { useLibraryPanelState } from "./useLibraryPanelState";

interface SessionLibrarySidebarProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  libraryPanel: ReturnType<typeof useLibraryPanelState>;
  filteredExercises: ExerciseWithDetails[];
  filteredBlockTemplates: LibraryTemplate[];
  onQuickAdd: () => void;
}

/** Swaps the session/program canvas's left panel between the Exercise
 * Library (drag an exercise into a block) and the Block Library (drag a
 * saved single-block template in as a whole new block). */
export function SessionLibrarySidebar({
  exercises,
  categories,
  styles,
  unitTypes,
  libraryPanel,
  filteredExercises,
  filteredBlockTemplates,
  onQuickAdd,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
  createStyleAction,
  createUnitTypeAction,
}: SessionLibrarySidebarProps) {
  const tabs = (
    <LibraryTabs
      active={libraryPanel.tab}
      onChange={libraryPanel.setTab}
      className="flex-1"
    />
  );

  return libraryPanel.tab === "exercises" ? (
    <ExerciseLibraryPanel
      exercises={exercises}
      categories={categories}
      styles={styles}
      unitTypes={unitTypes}
      tabs={tabs}
      items={filteredExercises}
      search={libraryPanel.exerciseSearch}
      onSearchChange={libraryPanel.setExerciseSearch}
      categoryId={libraryPanel.exerciseCategoryId}
      onCategoryChange={libraryPanel.setExerciseCategoryId}
      searchInputId={libraryPanel.exerciseSearchInputId}
      selectedIndex={libraryPanel.selectedIndex}
      onSelectedIndexChange={libraryPanel.setSelectedIndex}
      onQuickAdd={onQuickAdd}
      profileId={profileId}
      createExerciseAction={createExerciseAction}
      updateExerciseAction={updateExerciseAction}
      updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
      createCategoryAction={createCategoryAction}
      createStyleAction={createStyleAction}
      createUnitTypeAction={createUnitTypeAction}
    />
  ) : (
    <BlockLibraryPanel
      tabs={tabs}
      items={filteredBlockTemplates}
      search={libraryPanel.blockSearch}
      onSearchChange={libraryPanel.setBlockSearch}
      searchInputId={libraryPanel.blockSearchInputId}
      selectedIndex={libraryPanel.selectedIndex}
      onSelectedIndexChange={libraryPanel.setSelectedIndex}
      onQuickAdd={onQuickAdd}
    />
  );
}
