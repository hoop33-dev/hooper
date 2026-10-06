"use client";

import { useState } from "react";
import type { ExerciseCategoryRow, ExerciseWithDetails, ExerciseCategoryTreeNode } from "@hooper/db";
import { buildCategoryTree } from "@/src/lib/categoryTree";
import { CategorySidebar } from "./CategorySidebar";
import { CategoryDetailPanel } from "./CategoryDetailPanel";
import type { DropPosition } from "./CategoryTree";

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

function computeDropResult(
  categories: ExerciseCategoryRow[],
  dragId: string,
  targetId: string,
  position: DropPosition,
): { newParentId: string | null; positionUpdates: { id: string; position: number }[] } | null {
  const drag = categories.find((c) => c.id === dragId);
  const target = categories.find((c) => c.id === targetId);
  if (!drag || !target) return null;

  const newParentId: string | null =
    position === "inside" ? target.id : (target.parent_id ?? null);

  const newSiblings = categories
    .filter((c) => (c.parent_id ?? null) === newParentId && c.id !== dragId)
    .sort((a, b) => a.position - b.position);

  let insertIndex: number;
  if (position === "inside") {
    insertIndex = newSiblings.length;
  } else if (position === "before") {
    const idx = newSiblings.findIndex((c) => c.id === targetId);
    insertIndex = idx === -1 ? 0 : idx;
  } else {
    const idx = newSiblings.findIndex((c) => c.id === targetId);
    insertIndex = idx === -1 ? newSiblings.length : idx + 1;
  }

  newSiblings.splice(insertIndex, 0, drag);
  const newUpdates = newSiblings.map((c, i) => ({ id: c.id, position: i }));

  const oldParentId = drag.parent_id ?? null;
  const oldUpdates =
    oldParentId !== newParentId
      ? categories
          .filter((c) => (c.parent_id ?? null) === oldParentId && c.id !== dragId)
          .sort((a, b) => a.position - b.position)
          .map((c, i) => ({ id: c.id, position: i }))
      : [];

  const positionUpdates = [...newUpdates, ...oldUpdates].filter(
    (u, i, arr) => arr.findIndex((a) => a.id === u.id) === i,
  );

  return { newParentId, positionUpdates };
}

export function CategoryManagerShell(props: CategoryManagerShellProps) {
  const {
    initialCategories, exercises, initialSelectedId, createAction,
    updateAction, deleteAction, reorderAction, profileId,
  } = props;
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [mode, setMode] = useState<PanelMode>(initialSelectedId ? "view" : "blank");

  const tree: ExerciseCategoryTreeNode[] = buildCategoryTree(
    categories.map((c) => ({
      ...c,
      exercise_count: exercises.filter((ex) => ex.categories.some((ec) => ec.id === c.id)).length,
    })),
  );

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  function handleSelect(id: string) { setSelectedId(id); setMode("view"); }
  function handleStartCreate() { setSelectedId(null); setMode("create"); }

  async function handleCreate(data: { name: string; description: string; parent_id?: string }) {
    const result = await createAction({ ...data, created_by: profileId });
    if (result.ok && result.data) {
      setCategories((prev) => [...prev, result.data!]);
      setSelectedId(result.data.id);
      setMode("view");
    }
  }

  async function handleUpdate(id: string, data: { name: string; description: string; parent_id?: string | null }) {
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

  async function handleDrop(dragId: string, targetId: string, position: DropPosition) {
    const r = computeDropResult(categories, dragId, targetId, position);
    if (!r) return;
    const drag = categories.find((c) => c.id === dragId)!;
    setCategories((prev) => prev.map((c) => {
      if (c.id === dragId) return { ...c, parent_id: r.newParentId };
      const u = r.positionUpdates.find((p) => p.id === c.id);
      return u ? { ...c, position: u.position } : c;
    }));
    const ops: Promise<{ ok: boolean }>[] = [];
    if ((drag.parent_id ?? null) !== r.newParentId) ops.push(updateAction(dragId, { parent_id: r.newParentId }));
    if (r.positionUpdates.length > 0) ops.push(reorderAction(r.positionUpdates));
    await Promise.all(ops);
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
      handleDrop={handleDrop}
      handleCreate={handleCreate}
      handleUpdate={handleUpdate}
      handleDelete={handleDelete}
    />
  );
}

function CategoryManagerLayout({
  tree, selectedId, selectedCategory, categories, exercises, mode,
  handleSelect, handleStartCreate, handleDrop, handleCreate, handleUpdate, handleDelete,
}: {
  tree: ExerciseCategoryTreeNode[];
  selectedId: string | null;
  selectedCategory: ExerciseCategoryRow | null;
  categories: ExerciseCategoryRow[];
  exercises: ExerciseWithDetails[];
  mode: PanelMode;
  handleSelect: (id: string) => void;
  handleStartCreate: () => void;
  handleDrop: (dragId: string, targetId: string, position: DropPosition) => Promise<void>;
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
        onDrop={handleDrop}
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
