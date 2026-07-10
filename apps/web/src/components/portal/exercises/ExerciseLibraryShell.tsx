"use client";

import { getDescendantIds } from "@/src/lib/categoryTree";
import type {
  ExerciseCategoryRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
} from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PortalButton } from "../ui/PortalButton";
import { ExerciseCard } from "./ExerciseCard";
import type { ExerciseFormData } from "./ExerciseModal";
import { ExerciseModal } from "./ExerciseModal";

type ActionResult = { ok: boolean; error?: string; id?: string };

interface ExerciseLibraryShellProps {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  profileId: string;
  searchQuery: string;
  selectedCategoryId: string;
  /** When set (from /exercises/[id]), opens that exercise's edit modal on
   * mount so the URL and the open modal stay in sync. */
  initialEditExerciseId?: string;
  createAction: (data: ExerciseFormData) => Promise<ActionResult>;
  updateAction: (id: string, data: ExerciseFormData) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
  updateVideoUrlAction: (
    id: string,
    videoUrl: string,
    videoSource: ExerciseVideoSource,
  ) => Promise<ActionResult>;
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
        strokeWidth="2">
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

function CategoryFilterDropdown({
  categories,
  selected,
  onChange,
}: {
  categories: ExerciseCategoryRow[];
  selected: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = sortedHierarchical(categories);
  const selectedName = categories.find((c) => c.id === selected)?.name;

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition">
        <svg
          className="text-portal-text2 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h18M3 12h18M3 17h10"
          />
        </svg>
        {selectedName ?? "All categories"}
        <svg
          className="text-portal-text3 h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="border-portal-border bg-portal-card absolute top-full left-0 z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border py-1.5 shadow-lg">
          <DropdownItem active={selected === ""} onClick={() => choose("")}>
            All categories
          </DropdownItem>
          {items.map(({ cat, depth }) => (
            <DropdownItem
              key={cat.id}
              active={selected === cat.id}
              depth={depth}
              onClick={() => choose(cat.id)}>
              {cat.name}
            </DropdownItem>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  depth = 0,
  onClick,
  children,
}: {
  active: boolean;
  depth?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: `${1 + depth * 1}rem` }}
      className={`block w-full py-1.5 pr-4 text-left text-sm transition ${
        active
          ? "bg-portal-orange-soft text-portal-orange font-semibold"
          : "text-portal-text1 hover:bg-portal-border/50"
      }`}>
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
    <div className="border-portal-border bg-portal-card flex flex-wrap items-center gap-3 border-b px-7 py-3">
      <CategoryFilterDropdown
        categories={categories}
        selected={categoryFilter}
        onChange={onCategoryChange}
      />
      <Link
        href="/exercises/categories"
        className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition">
        <svg
          className="text-portal-text2 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h18M3 12h18M3 17h10"
          />
        </svg>
        Manage categories
      </Link>
      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
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
  initialEditExerciseId,
  createAction,
  updateAction,
  deleteAction,
  updateVideoUrlAction,
}: ExerciseLibraryShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<ExerciseWithDetails | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!initialEditExerciseId) return;
    const exercise = exercises.find((ex) => ex.id === initialEditExerciseId);
    if (exercise) {
      setEditingExercise(exercise);
      setModalOpen(true);
    }
  }, [initialEditExerciseId, exercises]);

  const categoryFilterIds = categoryFilter
    ? new Set([categoryFilter, ...getDescendantIds(categoryFilter, categories)])
    : null;

  const filtered = exercises.filter(
    (ex) =>
      (!search || ex.name.toLowerCase().includes(search.toLowerCase())) &&
      (!categoryFilterIds ||
        ex.categories.some((c) => categoryFilterIds.has(c.id))),
  );

  function openCreate() {
    setEditingExercise(null);
    setModalOpen(true);
  }
  function openEdit(exercise: ExerciseWithDetails) {
    setEditingExercise(exercise);
    setModalOpen(true);
    router.push(`/exercises/${exercise.id}`, { scroll: false });
  }
  function closeModal() {
    const wasEditing = editingExercise !== null;
    setModalOpen(false);
    setEditingExercise(null);
    if (wasEditing) router.push("/exercises", { scroll: false });
  }
  function handleSaved() {
    closeModal();
    startTransition(() => {});
  }

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
          updateVideoUrlAction={updateVideoUrlAction}
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
                className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
                {h}
              </th>
            ))}
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
          strokeWidth="1.5">
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
