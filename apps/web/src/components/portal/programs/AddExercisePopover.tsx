"use client";

import type { ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { filterExercises } from "./exerciseFilter";

interface AddExercisePopoverProps {
  exercises: ExerciseWithDetails[];
  onAdd: (exerciseId: string) => void;
}

function ResultsList({
  exercises,
  onSelect,
}: {
  exercises: ExerciseWithDetails[];
  onSelect: (id: string) => void;
}) {
  if (exercises.length === 0) {
    return (
      <div className="text-portal-text3 px-2.5 py-3 text-center text-[11px]">
        No results
      </div>
    );
  }
  return (
    <>
      {exercises.map((ex) => (
        <button
          key={ex.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ex.id);
          }}
          className="hover:bg-portal-bg text-portal-text1 block w-full truncate px-2.5 py-1.5 text-left text-xs">
          {ex.name}
        </button>
      ))}
    </>
  );
}

export function AddExercisePopover({
  exercises,
  onAdd,
}: AddExercisePopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = filterExercises(exercises, search, "");

  function handleSelect(id: string) {
    onAdd(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="border-portal-border text-portal-text2 hover:bg-portal-bg rounded-full border px-2.5 py-1 text-[11px] font-semibold">
        + Add
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="border-portal-border bg-portal-card absolute top-full right-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border shadow-lg">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search exercises…"
              className="border-portal-border text-portal-text1 w-full border-b px-2.5 py-2 text-xs outline-none"
            />
            <div className="max-h-56 overflow-y-auto">
              <ResultsList exercises={filtered} onSelect={handleSelect} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
