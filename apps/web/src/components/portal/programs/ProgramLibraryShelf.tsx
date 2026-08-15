"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { BlockLibraryShelfBody } from "./BlockLibraryShelf";
import type { LibraryTemplate } from "./blockTemplateFilter";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { ExerciseLibraryShelfBody } from "./ExerciseLibraryShelf";
import { LibraryTabs } from "./LibraryTabs";
import type { useLibraryPanelState } from "./useLibraryPanelState";

interface ProgramLibraryShelfProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  libraryPanel: ReturnType<typeof useLibraryPanelState>;
  filteredExercises: ExerciseWithDetails[];
  filteredBlockTemplates: LibraryTemplate[];
  onQuickAdd: () => void;
}

export function ProgramLibraryShelf({
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
}: ProgramLibraryShelfProps) {
  return (
    <div className="bg-portal-card flex-shrink-0">
      <div className="border-portal-border flex h-9 w-full flex-shrink-0 items-center gap-3 border-t px-4">
        <LibraryTabs
          active={libraryPanel.tab}
          onChange={(t) => {
            libraryPanel.setTab(t);
            libraryPanel.setOpen(true);
          }}
          className="w-40 flex-shrink-0"
        />
        <button
          type="button"
          onClick={() => libraryPanel.setOpen(!libraryPanel.open)}
          className="text-portal-text3 ml-auto text-[10px] font-semibold">
          {libraryPanel.open ? "Collapse" : "Expand"}
        </button>
      </div>
      {libraryPanel.open && (
        <div className="border-portal-border border-t">
          {libraryPanel.tab === "exercises" ? (
            <ExerciseLibraryShelfBody
              exercises={exercises}
              categories={categories}
              styles={styles}
              unitTypes={unitTypes}
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
            <BlockLibraryShelfBody
              items={filteredBlockTemplates}
              search={libraryPanel.blockSearch}
              onSearchChange={libraryPanel.setBlockSearch}
              searchInputId={libraryPanel.blockSearchInputId}
              selectedIndex={libraryPanel.selectedIndex}
              onSelectedIndexChange={libraryPanel.setSelectedIndex}
              onQuickAdd={onQuickAdd}
            />
          )}
        </div>
      )}
    </div>
  );
}
