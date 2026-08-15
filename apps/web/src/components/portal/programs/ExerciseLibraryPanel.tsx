"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { ExercisePreviewModal } from "../exercises/ExercisePreviewModal";
import { CreateExerciseButton } from "./CreateExerciseButton";
import { DraggableLibraryRow } from "./dnd/DraggableLibraryRow";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { handleLibrarySearchKeyDown } from "./librarySearchKeyboardNav";

interface ExerciseLibraryPanelProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  /** Replaces the plain "Exercise Library" title — used to show the
   * Exercises/Blocks tab switcher when a Block Library exists too. */
  tabs?: ReactNode;
  /** Pre-filtered by the shell (SessionViewShell) from `search`/
   * `categoryId`, so what's rendered always matches what Shift+A targets. */
  items: ExerciseWithDetails[];
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  searchInputId: string;
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onQuickAdd: () => void;
}

/** The panel's search + category filter header, extracted out of
 * ExerciseLibraryPanel so the component itself stays under the lint's
 * max-lines-per-function limit. */
function PanelHeader({
  tabs,
  resultCount,
  search,
  onSearch,
  onSearchKeyDown,
  searchInputId,
  categoryId,
  onCategory,
  categories,
}: {
  tabs?: ReactNode;
  resultCount: number;
  search: string;
  onSearch: (v: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchInputId: string;
  categoryId: string;
  onCategory: (v: string) => void;
  categories: ExerciseCategoryRow[];
}) {
  return (
    <div className="border-portal-border border-b px-3.5 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        {tabs ?? (
          <span className="text-portal-text3 text-[11px] font-bold tracking-wide uppercase">
            Exercise Library
          </span>
        )}
        <span className="text-portal-text3 text-[11px]">{resultCount}</span>
      </div>
      <input
        id={searchInputId}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={onSearchKeyDown}
        placeholder="Search exercises…"
        className="border-portal-border bg-portal-bg text-portal-text1 focus:border-portal-orange mb-2 h-8 w-full rounded-lg border px-2.5 text-xs outline-none"
      />
      <select
        value={categoryId}
        onChange={(e) => onCategory(e.target.value)}
        className="border-portal-border bg-portal-bg text-portal-text1 h-8 w-full rounded-lg border px-2 text-xs">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ExerciseLibraryPanel({
  exercises,
  categories,
  styles,
  unitTypes,
  tabs,
  items,
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  searchInputId,
  selectedIndex,
  onSelectedIndexChange,
  onQuickAdd,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
  createStyleAction,
  createUnitTypeAction,
}: ExerciseLibraryPanelProps) {
  const [previewExercise, setPreviewExercise] =
    useState<ExerciseWithDetails | null>(null);
  const [creating, setCreating] = useState(false);
  // Variants are chosen inside the measurement modal, not dragged/added as
  // their own picker rows — only base exercises show up here.
  const baseExercises = exercises.filter((ex) => !ex.parent_id);

  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <PanelHeader
        tabs={tabs}
        resultCount={items.length}
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
        categoryId={categoryId}
        onCategory={onCategoryChange}
        categories={categories}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.map((ex, index) => (
          <DraggableLibraryRow
            key={ex.id}
            exercise={ex}
            onOpen={setPreviewExercise}
            isSelected={index === selectedIndex}
          />
        ))}
        <CreateExerciseButton
          categories={categories}
          styles={styles}
          unitTypes={unitTypes}
          baseExercises={baseExercises}
          profileId={profileId}
          createExerciseAction={createExerciseAction}
          updateExerciseAction={updateExerciseAction}
          updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
          createCategoryAction={createCategoryAction}
          createStyleAction={createStyleAction}
          createUnitTypeAction={createUnitTypeAction}
          onPendingChange={setCreating}
          className="border-portal-border text-portal-text2 hover:bg-portal-orange-soft hover:text-portal-text1 flex w-full items-center gap-2 border-b border-dashed px-3.5 py-2.5 text-left text-xs font-semibold"
        />
        {creating && (
          <div className="text-portal-text3 flex items-center gap-2 px-3.5 py-2.5 text-xs">
            <span className="border-portal-text3 h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
            Adding exercise…
          </div>
        )}
        {items.length === 0 && (
          <div className="text-portal-text3 px-3.5 py-6 text-center text-xs">
            No results
          </div>
        )}
      </div>
      <div className="border-portal-border text-portal-text3 border-t px-3.5 py-2.5 text-[10px] leading-relaxed">
        Drag a card up to add it here.{" "}
        <Link href="/exercises" className="text-portal-orange hover:underline">
          Manage Exercise Library →
        </Link>
      </div>
      {previewExercise && (
        <ExercisePreviewModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}
    </div>
  );
}
