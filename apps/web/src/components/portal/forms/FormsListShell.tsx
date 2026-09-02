"use client";

import type { FormRow, FormSummary } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
import { FormCreateModal, type FormCreateFormData } from "./FormCreateModal";
import { FormEditDrawer, type FormEditFormData } from "./FormEditDrawer";
import { FormsTable } from "./FormsTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface FormsListShellProps {
  forms: FormSummary[];
  createAction: (data: FormCreateFormData) => Promise<ActionResult<FormRow>>;
  updateAction: (
    id: string,
    data: FormEditFormData,
  ) => Promise<ActionResult<FormRow>>;
  deleteAction: (id: string) => Promise<ActionResult>;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No forms yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Create a check-in form to collect info from athletes before a workout
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create form
      </PortalButton>
    </div>
  );
}

export function FormsListShell({
  forms,
  createAction,
  updateAction,
  deleteAction,
}: FormsListShellProps) {
  const { showError } = useToast();
  const { items: localForms, mutate } = useOptimisticList(forms);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FormSummary | null>(null);

  async function handleCreate(data: FormCreateFormData) {
    const result = await mutate<FormRow>(
      (prev) => prev,
      () => createAction(data),
      (prev, row) => [{ ...row, questionCount: 0, programCount: 0 }, ...prev],
    );
    if (result.ok) setCreateOpen(false);
    else showError(result.error ?? "Failed to create form.");
  }

  async function handleSave(data: FormEditFormData) {
    if (!editing) return;
    const id = editing.id;
    const result = await mutate<FormRow>(
      (prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, name: data.name, description: data.description ?? null }
            : f,
        ),
      () => updateAction(id, data),
      (prev, row) => prev.map((f) => (f.id === row.id ? { ...f, ...row } : f)),
    );
    if (result.ok) setEditing(null);
    else showError(result.error ?? "Failed to save changes.");
  }

  async function handleDelete() {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const result = await mutate(
      (prev) => prev.filter((f) => f.id !== id),
      () => deleteAction(id),
    );
    if (!result.ok) showError(result.error ?? "Failed to delete form.");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <PortalButton
          variant="primary"
          className="ml-auto"
          onClick={() => setCreateOpen(true)}>
          Create form
        </PortalButton>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {localForms.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <FormsTable forms={localForms} onEdit={setEditing} />
        )}
      </div>

      {createOpen && (
        <FormCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
      {editing && (
        <FormEditDrawer
          form={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
