"use client";

import { useState, useRef } from "react";
import type { ExerciseCategoryRow, ExerciseWithDetails, ExerciseCategoryTreeNode } from "@hooper/db";
import { buildCategoryTree } from "@/src/lib/categoryTree";
import { CategorySidebar } from "./CategorySidebar";
import { CategoryDetailPanel } from "./CategoryDetailPanel";

interface CategoryManagerShellProps {
  initialCategories: ExerciseCategoryRow[];
  exercises: ExerciseWithDetails[];
  initialSelectedId?: string;
  createAction: (data: { name: string; description: string; parent_id?: string; created_by: string }) => Promise<{ ok: boolean; error?: string; data?: ExerciseCategoryRow }>;
  updateAction: (id: string, data: { name?: string; description?: string; parent_id?: string | null }) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reorderAction: (updates: { id: string; position: number }[]) => Promise<{ ok: boolean; error?: string }>;
  profileId: string;
}

type PanelMode = "blank" | "view" | "create";

export function CategoryManagerShell(props: CategoryManagerShellProps) {
  const {
    initialCategories, exercises, initialSelectedId, createAction,
    updateAction, deleteAction, reorderAction, profileId,
  } = props;
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [mode, setMode] = useState<PanelMode>(
    initialSelectedId ? "view" : "blank",
  );

  const preReorderRef = useRef<ExerciseCategoryRow[]>([]);

  const tree: ExerciseCategoryTreeNode[] = buildCategoryTree(
    categories.map((c) => ({ ...c, exercise_count: 0 })),
  );

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setMode("view");
  }

  function handleStartCreate() {
    setSelectedId(null);
    setMode("create");
  }

  async function handleCreate(data: { name: string; description: string; parent_id?: string }) {
    const result = await createAction({ ...data, created_by: profileId });
    if (result.ok && result.data) {
      setCategories((prev) => [...prev, result.data!]);
      setSelectedId(result.data.id);
      setMode("view");
    }
  }

  async function handleUpdate(
    id: string,
    data: { name: string; description: string; parent_id?: string | null },
  ) {
    const result = await updateAction(id, data);
    if (result.ok) {
      setCategories((prev) => prev.map((c) =>
        c.id === id ? { ...c, name: data.name, description: data.description, parent_id: data.parent_id ?? null } : c,
      ));
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAction(id);
    if (result.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedId(null);
      setMode("blank");
    }
  }

  async function handleReorder(updates: { id: string; position: number }[]) {
    preReorderRef.current = categories;
    setCategories((prev) =>
      prev.map((c) => {
        const update = updates.find((u) => u.id === c.id);
        return update ? { ...c, position: update.position } : c;
      }),
    );
    const result = await reorderAction(updates);
    if (!result.ok) setCategories(preReorderRef.current);
  }

  return (
    <CategoryManagerLayout
      tree={tree}
      selectedId={selectedId}
      selectedCategory={selectedCategory}
      categories={categories}
      exercises={exercises}
      mode={mode}
      handleSelect={handleSelect}
      handleStartCreate={handleStartCreate}
      handleReorder={handleReorder}
      handleCreate={handleCreate}
      handleUpdate={handleUpdate}
      handleDelete={handleDelete}
    />
  );
}

function CategoryManagerLayout({
  tree,
  selectedId,
  selectedCategory,
  categories,
  exercises,
  mode,
  handleSelect,
  handleStartCreate,
  handleReorder,
  handleCreate,
  handleUpdate,
  handleDelete,
}: {
  tree: ExerciseCategoryTreeNode[];
  selectedId: string | null;
  selectedCategory: ExerciseCategoryRow | null;
  categories: ExerciseCategoryRow[];
  exercises: ExerciseWithDetails[];
  mode: PanelMode;
  handleSelect: (id: string) => void;
  handleStartCreate: () => void;
  handleReorder: (updates: { id: string; position: number }[]) => Promise<void>;
  handleCreate: (data: { name: string; description: string; parent_id?: string }) => Promise<void>;
  handleUpdate: (id: string, data: { name: string; description: string; parent_id?: string | null }) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <CategorySidebar
        tree={tree}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={handleStartCreate}
        onReorder={handleReorder}
      />
      <div className="flex flex-1 overflow-hidden">
        <CategoryDetailPanel
          category={selectedCategory}
          allCategories={categories}
          exercises={exercises}
          mode={mode}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onStartCreate={handleStartCreate}
        />
      </div>
    </div>
  );
}
