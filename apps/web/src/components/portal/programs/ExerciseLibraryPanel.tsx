"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { ExercisePreviewModal } from "../exercises/ExercisePreviewModal";
import { CreateExerciseButton } from "./CreateExerciseButton";
import { DraggableLibraryRow } from "./dnd/DraggableLibraryRow";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { filterExercises } from "./exerciseFilter";

interface ExerciseLibraryPanelProps extends CreateExerciseActions {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  /** Replaces the plain "Exercise Library" title — used to show the
   * Exercises/Blocks tab switcher when a Block Library exists too. */
  tabs?: ReactNode;
}

export function ExerciseLibraryPanel({
  exercises,
  categories,
  tabs,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
}: ExerciseLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [previewExercise, setPreviewExercise] =
    useState<ExerciseWithDetails | null>(null);
  const [creating, setCreating] = useState(false);
  const filtered = filterExercises(exercises, search, categoryId, categories);

  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border border-b px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {tabs ?? (
            <span className="text-portal-text3 text-[11px] font-bold tracking-wide uppercase">
              Exercise Library
            </span>
          )}
          <span className="text-portal-text3 text-[11px]">
            {filtered.length}
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="border-portal-border bg-portal-bg text-portal-text1 focus:border-portal-orange mb-2 h-8 w-full rounded-lg border px-2.5 text-xs outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border-portal-border bg-portal-bg text-portal-text1 h-8 w-full rounded-lg border px-2 text-xs">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((ex) => (
          <DraggableLibraryRow
            key={ex.id}
            exercise={ex}
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
          className="border-portal-border text-portal-text2 hover:bg-portal-orange-soft hover:text-portal-text1 flex w-full items-center gap-2 border-b border-dashed px-3.5 py-2.5 text-left text-xs font-semibold"
        />
        {creating && (
          <div className="text-portal-text3 flex items-center gap-2 px-3.5 py-2.5 text-xs">
            <span className="border-portal-text3 h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
            Adding exercise…
          </div>
        )}
        {filtered.length === 0 && (
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
