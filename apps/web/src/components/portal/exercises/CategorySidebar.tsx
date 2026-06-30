"use client";

import type { ExerciseCategoryTreeNode } from "@hooper/db";
import { CategoryTree } from "./CategoryTree";

interface CategorySidebarProps {
  tree: ExerciseCategoryTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReorder: (updates: { id: string; position: number }[]) => void;
}

export function CategorySidebar({
  tree,
  selectedId,
  onSelect,
  onCreate,
  onReorder,
}: CategorySidebarProps) {
  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col border-r border-portal-border bg-portal-card">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-portal-border px-5 py-4">
        <span className="text-sm font-bold text-portal-text1">Categories</span>
        <button
          type="button"
          onClick={onCreate}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-portal-orange text-white hover:brightness-110"
          title="Create category"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5">
        {tree.length === 0 ? (
          <p className="px-2 pt-4 text-center text-xs text-portal-text3">
            No categories yet.{" "}
            <button type="button" onClick={onCreate} className="text-portal-orange hover:underline">
              Create one
            </button>
          </p>
        ) : (
          <CategoryTree
            nodes={tree}
            selectedId={selectedId}
            onSelect={onSelect}
            onReorder={onReorder}
          />
        )}
      </div>
    </aside>
  );
}
