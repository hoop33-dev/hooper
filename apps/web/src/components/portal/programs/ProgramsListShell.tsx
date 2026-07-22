"use client";

import type { FormSummary, ProgramRow, ProgramSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import {
  ProgramCreateModal,
  type ProgramCreateFormData,
} from "./ProgramCreateModal";
import {
  ProgramEditDrawer,
  type ProgramEditFormData,
} from "./ProgramEditDrawer";
import { ProgramsTable } from "./ProgramsTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface ProgramsListShellProps {
  programs: ProgramSummary[];
  forms: FormSummary[];
  createAction: (
    data: ProgramCreateFormData,
  ) => Promise<ActionResult<ProgramRow>>;
  updateAction: (
    id: string,
    data: ProgramEditFormData,
  ) => Promise<ActionResult<ProgramRow>>;
  deleteAction: (id: string) => Promise<ActionResult>;
  publishAction: (id: string) => Promise<ActionResult<ProgramRow>>;
  attachFormAction: (
    programId: string,
    formId: string | null,
  ) => Promise<ActionResult<ProgramRow>>;
}

const STATUS_FILTERS = ["All", "Draft", "Active"] as const;

function FilterPills({
  filter,
  onChange,
}: {
  filter: (typeof STATUS_FILTERS)[number];
  onChange: (f: (typeof STATUS_FILTERS)[number]) => void;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-0.5">
      {STATUS_FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`rounded-md px-3.5 py-1 text-xs font-semibold transition ${
            filter === f
              ? "border-portal-border bg-portal-card text-portal-text1 border"
              : "text-portal-text3"
          }`}>
          {f}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No programs yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Create your first training program to get started
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create program
      </PortalButton>
    </div>
  );
}

export function ProgramsListShell({
  programs,
  forms,
  createAction,
  updateAction,
  deleteAction,
  publishAction,
  attachFormAction,
}: ProgramsListShellProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramSummary | null>(null);

  const filtered = programs.filter(
    (p) => filter === "All" || p.status === filter.toLowerCase(),
  );

  async function handleCreate(data: ProgramCreateFormData) {
    const result = await createAction(data);
    if (result.ok) {
      setCreateOpen(false);
      router.refresh();
    }
  }

  async function handleSave(data: ProgramEditFormData) {
    if (!editing) return;
    const result = await updateAction(editing.id, data);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  async function handlePublish() {
    if (!editing) return;
    await publishAction(editing.id);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteAction(editing.id);
    setEditing(null);
    router.refresh();
  }

  async function handleAttachForm(formId: string | null) {
    if (!editing) return;
    const result = await attachFormAction(editing.id, formId);
    if (result.ok && result.data) {
      setEditing({ ...editing, form_id: result.data.form_id });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <FilterPills filter={filter} onChange={setFilter} />
        <PortalButton
          variant="primary"
          className="ml-auto"
          onClick={() => setCreateOpen(true)}>
          Create program
        </PortalButton>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {filtered.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <ProgramsTable programs={filtered} onEdit={setEditing} />
        )}
      </div>

      {createOpen && (
        <ProgramCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
      {editing && (
        <ProgramEditDrawer
          program={editing}
          forms={forms}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onPublish={handlePublish}
          onDelete={handleDelete}
          onAttachForm={handleAttachForm}
        />
      )}
    </div>
  );
}
