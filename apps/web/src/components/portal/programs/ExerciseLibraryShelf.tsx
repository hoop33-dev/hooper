"use client";

import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { DraggableLibraryRow } from "./dnd/DraggableLibraryRow";
import { filterExercises } from "./exerciseFilter";

interface ExerciseLibraryShelfProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
}

function ShelfToggle({
  open,
  count,
  onToggle,
}: {
  open: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="border-portal-border bg-portal-card flex h-9 w-full flex-shrink-0 items-center gap-2 border-t px-4 text-left">
      <span className="text-portal-text1 text-[12px] font-bold">
        Exercise Library
      </span>
      <span className="text-portal-text3 text-[11px]">— {count} exercises</span>
      <span className="text-portal-text3 ml-auto text-[10px]">
        {open ? "Collapse" : "Expand"}
      </span>
    </button>
  );
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
    </div>
  );
}

export function ExerciseLibraryShelf({
  exercises,
  categories,
}: ExerciseLibraryShelfProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const filtered = filterExercises(exercises, search, categoryId);

  return (
    <div className="bg-portal-card flex-shrink-0">
      <ShelfToggle
        open={open}
        count={exercises.length}
        onToggle={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="border-portal-border flex h-[190px] border-t">
          <ShelfSidebar
            search={search}
            onSearch={setSearch}
            categoryId={categoryId}
            onCategory={setCategoryId}
            categories={categories}
          />
          <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto p-2.5">
            {filtered.map((ex) => (
              <DraggableLibraryRow key={ex.id} exercise={ex} variant="card" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
