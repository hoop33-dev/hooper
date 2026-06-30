"use client";

import { useState } from "react";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { getDescendantIds } from "@/src/lib/categoryTree";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";

interface CategoryDetailPanelProps {
  category: ExerciseCategoryRow | null;
  allCategories: ExerciseCategoryRow[];
  exercises: ExerciseWithDetails[];
  mode: "blank" | "view" | "create";
  onCreate: (data: { name: string; description: string; parent_id?: string }) => Promise<void>;
  onUpdate: (id: string, data: { name: string; description: string; parent_id?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStartCreate: () => void;
}

function BlankState({ onStartCreate }: { onStartCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-portal-border">
        <svg className="h-10 w-10 text-portal-text3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path strokeLinecap="round" d="M3 7h18M3 12h18M3 17h10" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-portal-text1">No category selected</p>
        <p className="mt-1 text-sm text-portal-text3">
          Select a category from the list or create a new one
        </p>
      </div>
      <PortalButton variant="primary" onClick={onStartCreate}>
        Create category
      </PortalButton>
    </div>
  );
}

function ParentSelector({
  allCategories,
  excludeIds,
  value,
  onChange,
}: {
  allCategories: ExerciseCategoryRow[];
  excludeIds: string[];
  value: string;
  onChange: (id: string) => void;
}) {
  const available = allCategories.filter(
    (c) => !excludeIds.includes(c.id) && !c.parent_id,
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-portal-text2">
        Parent category{" "}
        <span className="font-normal text-portal-text3">(optional)</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-portal-border bg-portal-card px-3 text-sm text-portal-text1 focus:border-portal-orange focus:outline-none"
      >
        <option value="">None (top-level)</option>
        {available.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryForm({
  initial,
  allCategories,
  excludeIds,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: { name: string; description: string; parent_id?: string | null };
  allCategories: ExerciseCategoryRow[];
  excludeIds: string[];
  onSubmit: (data: { name: string; description: string; parent_id?: string }) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [parentId, setParentId] = useState(initial?.parent_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        ...(parentId ? { parent_id: parentId } : {}),
      });
    } catch {
      setError("Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PortalInput
        id="cat-name"
        label="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Lower Body"
        required
      />
      <PortalTextarea
        id="cat-desc"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description…"
        rows={3}
      />
      <ParentSelector
        allCategories={allCategories}
        excludeIds={excludeIds}
        value={parentId}
        onChange={setParentId}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        {onCancel && (
          <PortalButton variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </PortalButton>
        )}
        <PortalButton variant="primary" onClick={handleSubmit} disabled={saving || !name.trim()}>
          {saving ? "Saving…" : submitLabel}
        </PortalButton>
      </div>
    </div>
  );
}

function ExerciseListItem({ exercise }: { exercise: ExerciseWithDetails }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-portal-bg">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-portal-orange-soft">
        <span className="text-[10px] font-extrabold text-portal-orange">
          {exercise.name.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <span className="text-sm text-portal-text1">{exercise.name}</span>
    </div>
  );
}

function DeleteZone({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <span className="flex-1 text-sm text-red-700">Delete this category?</span>
        <PortalButton variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</PortalButton>
        <PortalButton variant="danger" size="sm" onClick={onDelete}>Delete</PortalButton>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-red-500 hover:underline"
    >
      Delete category
    </button>
  );
}

function CreateMode({
  allCategories,
  onCreate,
}: {
  allCategories: ExerciseCategoryRow[];
  onCreate: (data: { name: string; description: string; parent_id?: string }) => Promise<void>;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full bg-portal-orange-soft px-2.5 py-1 text-xs font-bold text-portal-orange">
          Creating new category
        </span>
      </div>
      <CategoryForm
        allCategories={allCategories}
        excludeIds={[]}
        onSubmit={onCreate}
        submitLabel="Create category"
      />
    </div>
  );
}

function EditMode({
  category,
  allCategories,
  descendantIds,
  onUpdate,
  onCancel,
}: {
  category: ExerciseCategoryRow;
  allCategories: ExerciseCategoryRow[];
  descendantIds: string[];
  onUpdate: (id: string, data: { name: string; description: string; parent_id?: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h2 className="mb-6 font-title text-xl font-extrabold tracking-wide text-portal-text1">
        Edit category
      </h2>
      <CategoryForm
        initial={{
          name: category.name,
          description: category.description ?? "",
          parent_id: category.parent_id,
        }}
        allCategories={allCategories}
        excludeIds={[category.id, ...descendantIds]}
        onSubmit={async (data) => {
          await onUpdate(category.id, {
            ...data,
            parent_id: data.parent_id ?? null,
          });
          onCancel();
        }}
        onCancel={onCancel}
        submitLabel="Save changes"
      />
    </div>
  );
}

export function CategoryDetailPanel({
  category,
  allCategories,
  exercises,
  mode,
  onCreate,
  onUpdate,
  onDelete,
  onStartCreate,
}: CategoryDetailPanelProps) {
  const [editing, setEditing] = useState(false);

  if (mode === "blank") {
    return (
      <div className="flex flex-1 overflow-hidden">
        <BlankState onStartCreate={onStartCreate} />
      </div>
    );
  }

  if (mode === "create") {
    return <CreateMode allCategories={allCategories} onCreate={onCreate} />;
  }

  if (!category) return null;

  const descendantIds = getDescendantIds(category.id, allCategories);
  const parentName = allCategories.find((c) => c.id === category.parent_id)?.name;
  const categoryExercises = exercises.filter((ex) =>
    ex.categories.some((c) => c.id === category.id),
  );

  if (editing) {
    return (
      <EditMode
        category={category}
        allCategories={allCategories}
        descendantIds={descendantIds}
        onUpdate={onUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-start justify-between border-b border-portal-border px-8 py-6">
        <div>
          {parentName && (
            <p className="mb-1 text-xs text-portal-text3">{parentName} /</p>
          )}
          <h2 className="font-title text-2xl font-extrabold tracking-wide text-portal-text1">
            {category.name}
          </h2>
          {category.description && (
            <p className="mt-1 text-sm text-portal-text2">{category.description}</p>
          )}
        </div>
        <PortalButton variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </PortalButton>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-portal-text3">
          Exercises ({categoryExercises.length})
        </p>
        {categoryExercises.length === 0 ? (
          <p className="text-sm text-portal-text3">No exercises in this category yet.</p>
        ) : (
          <div className="flex flex-col">
            {categoryExercises.map((ex) => (
              <ExerciseListItem key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-end border-t border-portal-border px-8 py-4">
        <DeleteZone onDelete={async () => onDelete(category.id)} />
      </div>
    </div>
  );
}
