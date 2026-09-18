"use client";

import type { ExerciseStyleRow, ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";

interface StyleDetailPanelProps {
  style: ExerciseStyleRow | null;
  exercises: ExerciseWithDetails[];
  mode: "blank" | "view" | "create";
  onCreate: (data: { name: string; description: string }) => Promise<void>;
  onUpdate: (
    id: string,
    data: { name: string; description: string },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStartCreate: () => void;
}

function BlankState({ onStartCreate }: { onStartCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="bg-portal-border flex h-20 w-20 items-center justify-center rounded-2xl">
        <svg
          className="text-portal-text3 h-10 w-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2">
          <path strokeLinecap="round" d="M3 7h18M3 12h18M3 17h10" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No style selected</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Select a style from the list or create a new one
        </p>
      </div>
      <PortalButton variant="primary" onClick={onStartCreate}>
        Create style
      </PortalButton>
    </div>
  );
}

function StyleForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: { name: string; description: string };
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } catch {
      setError("Failed to save style.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PortalInput
        id="style-name"
        label="Style name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Should be dying"
        required
      />
      <PortalTextarea
        id="style-desc"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="How to interpret the unit types for this style…"
        rows={3}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        {onCancel && (
          <PortalButton variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </PortalButton>
        )}
        <PortalButton
          variant="primary"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}>
          {saving ? "Saving…" : submitLabel}
        </PortalButton>
      </div>
    </div>
  );
}

function ExerciseListItem({ exercise }: { exercise: ExerciseWithDetails }) {
  return (
    <div className="hover:bg-portal-bg flex items-center gap-3 rounded-lg px-3 py-2.5">
      <div className="bg-portal-orange-soft flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg">
        <span className="text-portal-orange text-[10px] font-extrabold">
          {exercise.name.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <span className="text-portal-text1 text-sm">{exercise.name}</span>
    </div>
  );
}

function DeleteZone({ onDelete }: { onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <InlineConfirmBar
      idleLabel="Delete style"
      confirmLabel="Delete this style?"
      onConfirm={handleDelete}
      loading={deleting}
    />
  );
}

function CreateMode({
  onCreate,
}: {
  onCreate: (data: { name: string; description: string }) => Promise<void>;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="bg-portal-orange-soft text-portal-orange rounded-full px-2.5 py-1 text-xs font-bold">
          Creating new style
        </span>
      </div>
      <StyleForm onSubmit={onCreate} submitLabel="Create style" />
    </div>
  );
}

function EditMode({
  style,
  onUpdate,
  onCancel,
}: {
  style: ExerciseStyleRow;
  onUpdate: (
    id: string,
    data: { name: string; description: string },
  ) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h2 className="font-title text-portal-text1 mb-6 text-xl font-extrabold tracking-wide">
        Edit style
      </h2>
      <StyleForm
        initial={{ name: style.name, description: style.description ?? "" }}
        onSubmit={async (data) => {
          await onUpdate(style.id, data);
          onCancel();
        }}
        onCancel={onCancel}
        submitLabel="Save changes"
      />
    </div>
  );
}

export function StyleDetailPanel({
  style,
  exercises,
  mode,
  onCreate,
  onUpdate,
  onDelete,
  onStartCreate,
}: StyleDetailPanelProps) {
  const [editing, setEditing] = useState(false);

  if (mode === "blank") {
    return (
      <div className="flex flex-1 overflow-hidden">
        <BlankState onStartCreate={onStartCreate} />
      </div>
    );
  }

  if (mode === "create") {
    return <CreateMode onCreate={onCreate} />;
  }

  if (!style) return null;

  const styleExercises = exercises.filter(
    (ex) => ex.default_style_id === style.id,
  );

  if (editing) {
    return (
      <EditMode
        style={style}
        onUpdate={onUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border flex flex-shrink-0 items-start justify-between border-b px-8 py-6">
        <div>
          <h2 className="font-title text-portal-text1 text-2xl font-extrabold tracking-wide">
            {style.name}
          </h2>
          {style.description && (
            <p className="text-portal-text2 mt-1 text-sm">
              {style.description}
            </p>
          )}
        </div>
        <PortalButton variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </PortalButton>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <p className="text-portal-text3 mb-3 text-xs font-semibold tracking-widest uppercase">
          Exercises with this default ({styleExercises.length})
        </p>
        {styleExercises.length === 0 ? (
          <p className="text-portal-text3 text-sm">
            No exercises default to this style yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {styleExercises.map((ex) => (
              <ExerciseListItem key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </div>

      <div className="border-portal-border flex flex-shrink-0 items-center justify-end border-t px-8 py-4">
        <DeleteZone onDelete={async () => onDelete(style.id)} />
      </div>
    </div>
  );
}
