"use client";

import type { SessionTemplateRow, SessionTemplateSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListToolbar, matchesSearch } from "../ui/ListToolbar";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
import { BlockLibraryCreateModal } from "./BlockLibraryCreateModal";
import { BlockLibraryTable } from "./BlockLibraryTable";
import { BlockTemplateEditDrawer } from "./BlockTemplateEditDrawer";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface BlockLibraryListShellProps {
  templates: SessionTemplateSummary[];
  createAction: (name: string) => Promise<ActionResult<SessionTemplateRow>>;
  renameAction: (id: string, name: string) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
}

function EmptyState({
  hasSearch,
  onCreateClick,
}: {
  hasSearch: boolean;
  onCreateClick: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 py-20 text-center">
        <p className="text-portal-text1 font-semibold">
          No templates match your search
        </p>
        <p className="text-portal-text3 text-sm">Try a different search</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No templates yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Save a block or session from a program, or start a new template here
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create template
      </PortalButton>
    </div>
  );
}

export function BlockLibraryListShell({
  templates,
  createAction,
  renameAction,
  deleteAction,
}: BlockLibraryListShellProps) {
  const router = useRouter();
  const { showError } = useToast();
  const { items: localTemplates, mutate } = useOptimisticList(templates);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SessionTemplateSummary | null>(null);
  const [search, setSearch] = useState("");
  const filtered = localTemplates.filter((t) => matchesSearch(search, t.name));

  async function handleCreate(name: string) {
    const result = await createAction(name);
    if (result.ok && result.data) {
      setCreateOpen(false);
      router.push(`/blocks/${result.data.id}`);
    } else {
      showError(result.error ?? "Failed to create template.");
    }
  }

  async function handleSave(name: string) {
    if (!editing) return;
    const id = editing.id;
    const result = await mutate(
      (prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)),
      () => renameAction(id, name),
    );
    if (result.ok) setEditing(null);
    else showError(result.error ?? "Failed to rename template.");
  }

  async function handleDelete() {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const result = await mutate(
      (prev) => prev.filter((t) => t.id !== id),
      () => deleteAction(id),
    );
    if (!result.ok) showError(result.error ?? "Failed to delete template.");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Block Library"
        subtitle="Save blocks and sessions once, reuse them across every program"
      />
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search templates…"
        onCreate={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {filtered.length === 0 ? (
          <EmptyState
            hasSearch={localTemplates.length > 0}
            onCreateClick={() => setCreateOpen(true)}
          />
        ) : (
          <BlockLibraryTable templates={filtered} onEdit={setEditing} />
        )}
      </div>

      {createOpen && (
        <BlockLibraryCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
      {editing && (
        <BlockTemplateEditDrawer
          template={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
