"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { DraggableLibraryRow } from "./dnd/DraggableLibraryRow";
import { filterExercises } from "./exerciseFilter";

interface ExerciseLibraryPanelProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
}

export function ExerciseLibraryPanel({
  exercises,
  categories,
}: ExerciseLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const filtered = filterExercises(exercises, search, categoryId);

  return (
    <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col border-r">
      <div className="border-portal-border border-b px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-portal-text3 text-[11px] font-bold tracking-wide uppercase">
            Exercise Library
          </span>
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
        {filtered.length === 0 ? (
          <div className="text-portal-text3 px-3.5 py-6 text-center text-xs">
            No results
          </div>
        ) : (
          filtered.map((ex) => (
            <DraggableLibraryRow key={ex.id} exercise={ex} />
          ))
        )}
      </div>
    </div>
  );
}
