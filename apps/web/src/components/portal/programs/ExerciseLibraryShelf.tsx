"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import Link from "next/link";
import { useState } from "react";
import { ExercisePreviewModal } from "../exercises/ExercisePreviewModal";
import { CreateExerciseButton } from "./CreateExerciseButton";
import { DraggableLibraryRow } from "./dnd/DraggableLibraryRow";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { filterExercises } from "./exerciseFilter";

interface ExerciseLibraryShelfProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
}

function ShelfSidebar({
  search,
  onSearch,
  categoryId,
  onCategory,
  categories,
}: {
  search: string;
  onSearch: (v: string) => void;
  categoryId: string;
  onCategory: (v: string) => void;
  categories: ExerciseCategoryRow[];
}) {
  return (
    <div className="border-portal-border flex w-[180px] flex-shrink-0 flex-col gap-2 border-r p-2.5">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search…"
        className="border-portal-border bg-portal-bg text-portal-text1 h-7 w-full rounded-md border px-2 text-[11px] outline-none"
      />
      <select
        value={categoryId}
        onChange={(e) => onCategory(e.target.value)}
        className="border-portal-border bg-portal-bg text-portal-text1 h-7 w-full rounded-md border px-1.5 text-[11px]">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <p className="text-portal-text3 mt-auto text-[10px] leading-relaxed">
        Drag a card up into any block above to add it.
      </p>
      <Link
        href="/exercises"
        className="text-portal-orange text-[10px] font-semibold hover:underline">
        Manage Exercise Library →
      </Link>
    </div>
  );
}

/** The shelf's expandable content — mounted only while the containing
 * ProgramLibraryShelf toggle is open (see ProgramLibraryShelf.tsx, which
 * owns the shared open/collapsed + Exercises/Blocks tab chrome). */
export function ExerciseLibraryShelfBody({
  exercises,
  categories,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
}: ExerciseLibraryShelfProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [previewExercise, setPreviewExercise] =
    useState<ExerciseWithDetails | null>(null);
  const [creating, setCreating] = useState(false);
  const filtered = filterExercises(exercises, search, categoryId, categories);

  return (
    <div className="flex h-[190px]">
      <ShelfSidebar
        search={search}
        onSearch={setSearch}
        categoryId={categoryId}
        onCategory={setCategoryId}
        categories={categories}
      />
      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto p-2.5">
        {filtered.map((ex) => (
          <DraggableLibraryRow
            key={ex.id}
            exercise={ex}
            variant="card"
            onOpen={setPreviewExercise}
          />
        ))}
        <CreateExerciseButton
          categories={categories}
          profileId={profileId}
          createExerciseAction={createExerciseAction}
          updateExerciseAction={updateExerciseAction}
          updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
          createCategoryAction={createCategoryAction}
          onPendingChange={setCreating}
          className="border-portal-border text-portal-text2 hover:bg-portal-orange-soft hover:text-portal-text1 flex h-[52px] w-[136px] flex-shrink-0 items-center justify-center rounded-lg border border-dashed px-2.5 text-center text-[11px] font-bold"
        />
        {creating && (
          <div className="border-portal-border text-portal-text3 flex h-[52px] w-[136px] flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold">
            <span className="border-portal-text3 h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
            Adding…
          </div>
        )}
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
