"use client";

import type { SessionTemplateRow, SessionTemplateSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SessionRenamePopover } from "../programs/SessionRenamePopover";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
import { BlockLibraryCreateModal } from "./BlockLibraryCreateModal";
import { BlockLibraryTable } from "./BlockLibraryTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface BlockLibraryListShellProps {
  templates: SessionTemplateSummary[];
  createAction: (name: string) => Promise<ActionResult<SessionTemplateRow>>;
  renameAction: (id: string, name: string) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
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
  const [renaming, setRenaming] = useState<SessionTemplateSummary | null>(null);

  async function handleCreate(name: string) {
    const result = await createAction(name);
    if (result.ok && result.data) {
      setCreateOpen(false);
      router.push(`/blocks/${result.data.id}`);
    } else {
      showError(result.error ?? "Failed to create template.");
    }
  }

  async function handleRename(name: string) {
    if (!renaming) return;
    const id = renaming.id;
    setRenaming(null);
    const result = await mutate(
      (prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)),
      () => renameAction(id, name),
    );
    if (!result.ok) showError(result.error ?? "Failed to rename template.");
  }

  async function handleDelete(template: SessionTemplateSummary) {
    const result = await mutate(
      (prev) => prev.filter((t) => t.id !== template.id),
      () => deleteAction(template.id),
    );
    if (!result.ok) showError(result.error ?? "Failed to delete template.");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Block Library"
        subtitle="Save blocks and sessions once, reuse them across every program"
        action={
          <PortalButton variant="primary" onClick={() => setCreateOpen(true)}>
            Create template
          </PortalButton>
        }
      />

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {localTemplates.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <BlockLibraryTable
            templates={localTemplates}
            onRename={setRenaming}
            onDelete={handleDelete}
          />
        )}
      </div>

      {createOpen && (
        <BlockLibraryCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
      {renaming && (
        <SessionRenamePopover
          currentName={renaming.name}
          title="Rename template"
          onClose={() => setRenaming(null)}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
