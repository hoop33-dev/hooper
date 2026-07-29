"use client";

import { cn } from "@/src/lib/cn";
import type { ExerciseCategoryRow } from "@hooper/db";
import { useEffect, useRef, useState } from "react";

interface CategoryComboboxProps {
  categories: ExerciseCategoryRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** When provided, shows an inline "+ Add category" affordance in the
   * dropdown so a coach doesn't have to leave the exercise modal to create
   * one. `profileId` becomes the new category's `created_by`. */
  createCategoryAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseCategoryRow; error?: string }>;
  profileId?: string;
}

export function CategoryCombobox({
  categories,
  selected,
  onChange,
  placeholder = "Select categories…",
  createCategoryAction,
  profileId,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [extraCategories, setExtraCategories] = useState<ExerciseCategoryRow[]>(
    [],
  );
  const ref = useRef<HTMLDivElement>(null);
  const allCategories =
    extraCategories.length > 0
      ? [...categories, ...extraCategories]
      : categories;

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function createCategory(name: string) {
    if (!createCategoryAction || !profileId) return;
    const result = await createCategoryAction({ name, created_by: profileId });
    if (result.ok && result.data) {
      setExtraCategories((prev) => [...prev, result.data!]);
      onChange([...selected, result.data.id]);
    }
    return result;
  }

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <p className="text-portal-text2 text-xs font-semibold">Categories</p>

      <SelectedChips
        selected={selected}
        categories={allCategories}
        onRemove={toggle}
      />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-portal-border bg-portal-card text-portal-text2 hover:border-portal-orange flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm focus:outline-none">
        <span>
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        <svg
          className="text-portal-text3 h-4 w-4"
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
        <CategoryDropdown
          categories={allCategories}
          selected={selected}
          search={search}
          onSearchChange={setSearch}
          expanded={expanded}
          onToggle={toggle}
          onToggleExpand={toggleExpand}
          onCreateCategory={
            createCategoryAction && profileId ? createCategory : undefined
          }
        />
      )}
    </div>
  );
}

function AddCategoryRow({
  onCreate,
}: {
  onCreate: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string } | undefined>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    const result = await onCreate(trimmed);
    setSaving(false);
    if (result && !result.ok) {
      setError(result.error ?? "Couldn't create category.");
      return;
    }
    setName("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-portal-orange hover:bg-portal-bg flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-semibold">
        <span className="text-base leading-none">+</span> Add category
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setAdding(false);
              setName("");
            }
          }}
          placeholder="New category name…"
          className="border-portal-border text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-8 flex-1 rounded-lg border px-2.5 text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !name.trim()}
          className="bg-portal-orange h-8 rounded-lg px-2.5 text-xs font-bold text-white disabled:opacity-50">
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectedChips({
  selected,
  categories,
  onRemove,
}: {
  selected: string[];
  categories: ExerciseCategoryRow[];
  onRemove: (id: string) => void;
}) {
  const selectedNames = selected
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  if (selectedNames.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedNames.map((name, i) => (
        <span
          key={selected[i]}
          className="bg-portal-orange-soft text-portal-orange inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
          {name}
          <button
            type="button"
            onClick={() => onRemove(selected[i])}
            className="ml-0.5 rounded-full hover:opacity-70">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function CategoryDropdown({
  categories,
  selected,
  search,
  onSearchChange,
  expanded,
  onToggle,
  onToggleExpand,
  onCreateCategory,
}: {
  categories: ExerciseCategoryRow[];
  selected: string[];
  search: string;
  onSearchChange: (v: string) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCreateCategory?: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string } | undefined>;
}) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parent_id === id);

  function matches(name: string) {
    return name.toLowerCase().includes(search.toLowerCase());
  }

  return (
    <div className="border-portal-border bg-portal-card absolute top-full z-50 mt-1 w-full rounded-xl border shadow-lg">
      <div className="p-2">
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search categories…"
          className="border-portal-border text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-8 w-full rounded-lg border px-3 text-sm focus:outline-none"
        />
      </div>
      <div className="max-h-60 overflow-y-auto pb-2">
        {topLevel
          .filter(
            (cat) =>
              matches(cat.name) ||
              childrenOf(cat.id).some((c) => matches(c.name)),
          )
          .map((cat) => {
            const children = childrenOf(cat.id).filter(
              (c) => !search || matches(c.name),
            );
            const isExpanded = expanded.has(cat.id) || !!search;
            return (
              <div key={cat.id}>
                <CategoryComboboxItem
                  name={cat.name}
                  checked={selected.includes(cat.id)}
                  hasChildren={children.length > 0}
                  isExpanded={isExpanded}
                  onToggle={() => onToggle(cat.id)}
                  onExpand={() => onToggleExpand(cat.id)}
                />
                {isExpanded &&
                  children.map((child) => (
                    <CategoryComboboxItem
                      key={child.id}
                      name={child.name}
                      checked={selected.includes(child.id)}
                      hasChildren={false}
                      isExpanded={false}
                      indent
                      onToggle={() => onToggle(child.id)}
                      onExpand={() => {}}
                    />
                  ))}
              </div>
            );
          })}
      </div>
      {onCreateCategory && (
        <div className="border-portal-border border-t">
          <AddCategoryRow onCreate={onCreateCategory} />
        </div>
      )}
    </div>
  );
}

function CategoryComboboxItem({
  name,
  checked,
  hasChildren,
  isExpanded,
  indent = false,
  onToggle,
  onExpand,
}: {
  name: string;
  checked: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  indent?: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  return (
    <div
      className={cn(
        "hover:bg-portal-bg flex cursor-pointer items-center gap-2 px-3 py-2",
        indent && "pl-8",
      )}
      onClick={onToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="accent-portal-orange h-3.5 w-3.5 rounded"
      />
      <span className="text-portal-text1 flex-1 text-sm">{name}</span>
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="text-portal-text3 hover:text-portal-text2">
          <svg
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90",
            )}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
