"use client";

import {
  DropdownAddRow,
  DropdownList,
  DropdownListItem,
  DropdownPanel,
  DropdownSearchInput,
  DropdownTrigger,
  useDropdown,
} from "@/src/components/portal/ui/Dropdown";
import type { ExerciseCategoryRow } from "@hooper/db";
import { useState, type RefObject } from "react";

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
  const { open, setOpen, anchorRef, panelRef } = useDropdown();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [extraCategories, setExtraCategories] = useState<ExerciseCategoryRow[]>(
    [],
  );
  const allCategories =
    extraCategories.length > 0
      ? [...categories, ...extraCategories]
      : categories;

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
    <div className="flex flex-col gap-1">
      <p className="text-portal-text2 text-xs font-semibold">Categories</p>

      <SelectedChips
        selected={selected}
        categories={allCategories}
        onRemove={toggle}
      />

      <DropdownTrigger anchorRef={anchorRef} onClick={() => setOpen((o) => !o)}>
        {selected.length > 0 ? `${selected.length} selected` : placeholder}
      </DropdownTrigger>

      {open && (
        <CategoryDropdown
          anchorRef={anchorRef}
          panelRef={panelRef}
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
  anchorRef,
  panelRef,
  categories,
  selected,
  search,
  onSearchChange,
  expanded,
  onToggle,
  onToggleExpand,
  onCreateCategory,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
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
    <DropdownPanel anchorRef={anchorRef} panelRef={panelRef}>
      <DropdownSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search categories…"
      />
      <DropdownList>
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
                <DropdownListItem
                  variant="checkbox"
                  label={cat.name}
                  selected={selected.includes(cat.id)}
                  hasChildren={children.length > 0}
                  isExpanded={isExpanded}
                  onSelect={() => onToggle(cat.id)}
                  onExpand={() => onToggleExpand(cat.id)}
                />
                {isExpanded &&
                  children.map((child) => (
                    <DropdownListItem
                      key={child.id}
                      variant="checkbox"
                      label={child.name}
                      selected={selected.includes(child.id)}
                      indent
                      onSelect={() => onToggle(child.id)}
                    />
                  ))}
              </div>
            );
          })}
      </DropdownList>
      {onCreateCategory && (
        <div className="border-portal-border border-t">
          <DropdownAddRow itemLabel="category" onCreate={onCreateCategory} />
        </div>
      )}
    </DropdownPanel>
  );
}
