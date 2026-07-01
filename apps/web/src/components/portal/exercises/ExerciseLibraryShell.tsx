"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { getDescendantIds } from "@/src/lib/categoryTree";
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
  createAction: (
    data: ExerciseFormData,
  ) => Promise<{ ok: boolean; error?: string }>;
  updateAction: (
    id: string,
    data: ExerciseFormData,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  uploadVideoAction: (
    exerciseId: string,
    file: File,
    profileId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        className="text-portal-text3 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search exercises…"
        className="border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-9 w-64 rounded-lg border pr-3 pl-9 text-sm focus:outline-none"
      />
    </div>
  );
}

function sortedHierarchical(
  cats: ExerciseCategoryRow[],
  parentId: string | null = null,
  depth = 0,
): { cat: ExerciseCategoryRow; depth: number }[] {
  return cats
    .filter((c) => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.position - b.position)
    .flatMap((c) => [
      { cat: c, depth },
      ...sortedHierarchical(cats, c.id, depth + 1),
    ]);
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
  const items = sortedHierarchical(categories);
  return (
    <div className="flex gap-1 overflow-x-auto">
      <TabButton active={selected === ""} onClick={() => onChange("")}>
        All
      </TabButton>
      {items.map(({ cat }) => (
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
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
        active
          ? "bg-portal-orange text-white"
          : "text-portal-text2 hover:bg-portal-border-mid"
      }`}
    >
      {children}
    </button>
  );
}

function LibraryToolbar({
  categories,
  categoryFilter,
  onCategoryChange,
  search,
  onSearchChange,
  onCreateClick,
}: {
  categories: ExerciseCategoryRow[];
  categoryFilter: string;
  onCategoryChange: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex items-center gap-3 border-b px-7 py-3">
      <CategoryTabs categories={categories} selected={categoryFilter} onChange={onCategoryChange} />
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/exercises/categories"
          className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition"
        >
          <svg className="text-portal-text2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
          </svg>
          Categories
        </Link>
        <SearchBar value={search} onChange={onSearchChange} />
        <PortalButton variant="primary" onClick={onCreateClick}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create exercise
        </PortalButton>
      </div>
    </div>
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
  const [editingExercise, setEditingExercise] =
    useState<ExerciseWithDetails | null>(null);
  const [, startTransition] = useTransition();

  const categoryFilterIds = categoryFilter
    ? new Set([categoryFilter, ...getDescendantIds(categoryFilter, categories)])
    : null;

  const filtered = exercises.filter(
    (ex) =>
      (!search || ex.name.toLowerCase().includes(search.toLowerCase())) &&
      (!categoryFilterIds ||
        ex.categories.some((c) => categoryFilterIds.has(c.id))),
  );

  function openCreate() { setEditingExercise(null); setModalOpen(true); }
  function openEdit(exercise: ExerciseWithDetails) { setEditingExercise(exercise); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingExercise(null); }
  function handleSaved() { closeModal(); startTransition(() => {}); }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LibraryToolbar
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        search={search}
        onSearchChange={setSearch}
        onCreateClick={openCreate}
      />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            hasFilters={!!(search || categoryFilter)}
            onCreateClick={openCreate}
          />
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
          <tr className="border-portal-border border-b">
            {["Exercise", "Categories", "Unit types", "Created"].map((h) => (
              <th
                key={h}
                className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase"
              >
                {h}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={onEdit}
            />
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
      <div className="bg-portal-border flex h-16 w-16 items-center justify-center rounded-2xl">
        <svg
          className="text-portal-text3 h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 5v14M18 5v14M2 9h4v6H2zM18 9h4v6h-4zM6 12h12"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">
          {hasFilters ? "No exercises match your search" : "No exercises yet"}
        </p>
        <p className="text-portal-text3 mt-1 text-sm">
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
