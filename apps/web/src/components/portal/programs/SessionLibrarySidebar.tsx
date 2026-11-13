"use client";

import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  LibrarySequenceWithDetails,
} from "@hooper/db";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import type { LibraryTemplate } from "./blockTemplateFilter";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { ExerciseLibraryPanel } from "./ExerciseLibraryPanel";
import { LibraryTabs } from "./LibraryTabs";
import { SequenceLibraryPanel } from "./SequenceLibraryPanels";
import type { useLibraryPanelState } from "./useLibraryPanelState";

interface SessionLibrarySidebarProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  libraryPanel: ReturnType<typeof useLibraryPanelState>;
  filteredExercises: ExerciseWithDetails[];
  filteredBlockTemplates: LibraryTemplate[];
  /** Set where sequences can be added — shows the Sequences tab. */
  filteredSequences?: LibrarySequenceWithDetails[];
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
  filteredSequences,
  onQuickAdd,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  replaceExercisePhotosAction,
  createCategoryAction,
  createStyleAction,
  createUnitTypeAction,
}: SessionLibrarySidebarProps) {
  const tabs = (
    <LibraryTabs
      active={libraryPanel.tab}
      onChange={libraryPanel.setTab}
      className="flex-1"
      withSequences={!!filteredSequences}
    />
  );

  if (libraryPanel.tab === "sequences" && filteredSequences) {
    return (
      <SequenceLibraryPanel
        tabs={tabs}
        items={filteredSequences}
        search={libraryPanel.sequenceSearch}
        onSearchChange={libraryPanel.setSequenceSearch}
        searchInputId={libraryPanel.sequenceSearchInputId}
        selectedIndex={libraryPanel.selectedIndex}
        onSelectedIndexChange={libraryPanel.setSelectedIndex}
        onQuickAdd={onQuickAdd}
      />
    );
  }

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
      replaceExercisePhotosAction={replaceExercisePhotosAction}
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
