"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { ExerciseModal } from "./ExerciseModal";
import { ExerciseCard } from "./ExerciseCard";
import { PortalButton } from "../ui/PortalButton";
import type { ExerciseFormData } from "./ExerciseModal";

interface ExerciseLibraryShellProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  profileId: string;
  searchQuery: string;
  selectedCategoryId: string;
  createAction: (data: ExerciseFormData) => Promise<{ ok: boolean; error?: string }>;
  updateAction: (id: string, data: ExerciseFormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  uploadVideoAction: (exerciseId: string, file: File, profileId: string) => Promise<{ ok: boolean; error?: string }>;
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-portal-text3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search exercises…"
        className="h-9 w-64 rounded-lg border border-portal-border bg-portal-card pl-9 pr-3 text-sm text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange focus:outline-none"
      />
    </div>
  );
}

function CategoryTabs({
  categories,
  selected,
  onChange,
}: {
  categories: ExerciseCategoryRow[];
  selected: string;
  onChange: (id: string) => void;
}) {
  const topLevel = categories.filter((c) => !c.parent_id);
  return (
    <div className="flex gap-1 overflow-x-auto">
      <TabButton active={selected === ""} onClick={() => onChange("")}>
        All
      </TabButton>
      {topLevel.map((cat) => (
        <TabButton
          key={cat.id}
          active={selected === cat.id}
          onClick={() => onChange(cat.id)}
        >
          {cat.name}
        </TabButton>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-portal-orange text-white"
          : "text-portal-text2 hover:bg-portal-border-mid"
      }`}
    >
      {children}
    </button>
  );
}

export function ExerciseLibraryShell({
  exercises,
  categories,
  profileId,
  createAction,
  updateAction,
  deleteAction,
  uploadVideoAction,
}: ExerciseLibraryShellProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseWithDetails | null>(null);
  const [, startTransition] = useTransition();

  const filtered = exercises.filter(
    (ex) =>
      (!search || ex.name.toLowerCase().includes(search.toLowerCase())) &&
      (!categoryFilter || ex.categories.some((c) => c.id === categoryFilter)),
  );

  function openCreate() { setEditingExercise(null); setModalOpen(true); }
  function openEdit(exercise: ExerciseWithDetails) { setEditingExercise(exercise); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingExercise(null); }
  function handleSaved() { closeModal(); startTransition(() => {}); }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-portal-border bg-portal-card px-7 py-3">
        <CategoryTabs
          categories={categories}
          selected={categoryFilter}
          onChange={setCategoryFilter}
        />
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/exercises/categories"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-portal-border bg-portal-card px-4 text-sm font-semibold text-portal-text1 hover:bg-portal-border/50 transition"
          >
            <svg className="h-3.5 w-3.5 text-portal-text2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
            </svg>
            Categories
          </Link>
          <SearchBar value={search} onChange={setSearch} />
          <PortalButton variant="primary" onClick={openCreate}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create exercise
          </PortalButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={!!(search || categoryFilter)} onCreateClick={openCreate} />
        ) : (
          <ExerciseTable exercises={filtered} onEdit={openEdit} />
        )}
      </div>

      {modalOpen && (
        <ExerciseModal
          mode={editingExercise ? "edit" : "create"}
          exercise={editingExercise ?? undefined}
          categories={categories}
          profileId={profileId}
          onSave={handleSaved}
          onClose={closeModal}
          onDelete={handleSaved}
          createAction={createAction}
          updateAction={updateAction}
          deleteAction={deleteAction}
          uploadVideoAction={uploadVideoAction}
        />
      )}
    </div>
  );
}

function ExerciseTable({
  exercises,
  onEdit,
}: {
  exercises: ExerciseWithDetails[];
  onEdit: (exercise: ExerciseWithDetails) => void;
}) {
  return (
    <div className="px-7 py-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-portal-border">
            {["Exercise", "Categories", "Unit types", "Created"].map((h) => (
              <th
                key={h}
                className="pb-3 pt-4 pr-4 text-left text-[11px] font-semibold uppercase tracking-widest text-portal-text3"
              >
                {h}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreateClick,
}: {
  hasFilters: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-portal-border">
        <svg className="h-8 w-8 text-portal-text3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v14M18 5v14M2 9h4v6H2zM18 9h4v6h-4zM6 12h12" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-portal-text1">
          {hasFilters ? "No exercises match your search" : "No exercises yet"}
        </p>
        <p className="mt-1 text-sm text-portal-text3">
          {hasFilters
            ? "Try a different search or category filter"
            : "Create your first exercise to get started"}
        </p>
      </div>
      {!hasFilters && (
        <PortalButton variant="primary" onClick={onCreateClick}>
          Create exercise
        </PortalButton>
      )}
    </div>
  );
}
