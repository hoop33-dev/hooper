"use client";

import type { FormRow, FormSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
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
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FormSummary | null>(null);

  async function handleCreate(data: FormCreateFormData) {
    const result = await createAction(data);
    if (result.ok) {
      setCreateOpen(false);
      router.refresh();
    }
  }

  async function handleSave(data: FormEditFormData) {
    if (!editing) return;
    const result = await updateAction(editing.id, data);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteAction(editing.id);
    setEditing(null);
    router.refresh();
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
        {forms.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <FormsTable forms={forms} onEdit={setEditing} />
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
