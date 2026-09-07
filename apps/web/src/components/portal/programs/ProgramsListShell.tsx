"use client";

import type { FormSummary, ProgramRow, ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
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

type ProgramListMutations = Pick<
  ProgramsListShellProps,
  | "createAction"
  | "updateAction"
  | "deleteAction"
  | "publishAction"
  | "attachFormAction"
>;

/** Owns the optimistic program list plus the create-modal / edit-drawer
 * state, so every mutation patches the table immediately and only closes its
 * modal once the action resolves (see router-refresh-modal-gap). */
function useProgramListActions(
  programs: ProgramSummary[],
  actions: ProgramListMutations,
) {
  const { showError } = useToast();
  const { items, mutate } = useOptimisticList(programs);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramSummary | null>(null);

  const patchRow = (prev: ProgramSummary[], row: ProgramRow) =>
    prev.map((p) => (p.id === row.id ? { ...p, ...row } : p));

  async function handleCreate(data: ProgramCreateFormData) {
    const result = await mutate<ProgramRow>(
      (prev) => prev,
      () => actions.createAction(data),
      (prev, row) => [
        { ...row, sessionCount: 0, sessionsPerWeek: null },
        ...prev,
      ],
    );
    if (result.ok) setCreateOpen(false);
    else showError(result.error ?? "Failed to create program.");
  }

  async function handleSave(data: ProgramEditFormData) {
    if (!editing) return;
    const id = editing.id;
    const result = await mutate<ProgramRow>(
      (prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: data.name,
                description: data.description ?? null,
                notes: data.notes ?? null,
              }
            : p,
        ),
      () => actions.updateAction(id, data),
      patchRow,
    );
    if (result.ok) setEditing(null);
    else showError(result.error ?? "Failed to save changes.");
  }

  async function handlePublish() {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const result = await mutate<ProgramRow>(
      (prev) => prev.map((p) => (p.id === id ? { ...p, status: "active" } : p)),
      () => actions.publishAction(id),
      patchRow,
    );
    if (!result.ok) showError(result.error ?? "Failed to publish program.");
  }

  async function handleDelete() {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const result = await mutate(
      (prev) => prev.filter((p) => p.id !== id),
      () => actions.deleteAction(id),
    );
    if (!result.ok) showError(result.error ?? "Failed to delete program.");
  }

  async function handleAttachForm(formId: string | null) {
    if (!editing) return;
    const id = editing.id;
    const result = await mutate<ProgramRow>(
      (prev) => prev.map((p) => (p.id === id ? { ...p, form_id: formId } : p)),
      () => actions.attachFormAction(id, formId),
      patchRow,
    );
    if (result.ok && result.data) {
      const row = result.data;
      setEditing((cur) => (cur ? { ...cur, form_id: row.form_id } : cur));
    } else if (!result.ok) {
      showError(result.error ?? "Failed to update form.");
    }
  }

  return {
    programs: items,
    createOpen,
    setCreateOpen,
    editing,
    setEditing,
    handleCreate,
    handleSave,
    handlePublish,
    handleDelete,
    handleAttachForm,
  };
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
  const {
    programs: localPrograms,
    createOpen,
    setCreateOpen,
    editing,
    setEditing,
    handleCreate,
    handleSave,
    handlePublish,
    handleDelete,
    handleAttachForm,
  } = useProgramListActions(programs, {
    createAction,
    updateAction,
    deleteAction,
    publishAction,
    attachFormAction,
  });
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = localPrograms.filter(
    (p) => filter === "All" || p.status === filter.toLowerCase(),
  );

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
