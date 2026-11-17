"use client";

import type { SequenceInput } from "@/src/services/sequence.service";
import type { LibrarySequenceWithDetails } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChainIcon } from "../ui/icons";
import { ListToolbar, matchesSearch } from "../ui/ListToolbar";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
import { SequenceChainChips } from "./SequenceChain";
import {
  SequenceCreateModal,
  type SequenceDetails,
} from "./SequenceCreateModal";
import { blankDraft, toSequenceInput } from "./sequenceDraft";
import { SequenceEditDrawer } from "./SequenceEditDrawer";

type ActionResult = { ok: boolean; error?: string };

function EmptyState({
  hasSearch,
  onCreate,
}: {
  hasSearch: boolean;
  onCreate: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center gap-1 py-20 text-center">
        <p className="text-portal-text1 font-semibold">
          No sequences match your search
        </p>
        <p className="text-portal-text3 text-sm">Try a different search</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No sequences yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Chain exercises into one drill, like a dribble move, a pass, a cut and
          a finish
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreate}>
        Create sequence
      </PortalButton>
    </div>
  );
}

function SequenceTable({
  sequences,
  onEdit,
}: {
  sequences: LibrarySequenceWithDetails[];
  onEdit: (sequence: LibrarySequenceWithDetails) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {["Sequence", "Steps", "Sets"].map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
              {h}
            </th>
          ))}
          <th className="w-20" />
        </tr>
      </thead>
      <tbody>
        {sequences.map((sequence) => (
          <tr
            key={sequence.id}
            className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
            <td className="min-w-[220px] py-3.5 pr-4">
              <AppLink
                href={`/sequences/${sequence.id}`}
                className="flex items-center gap-3 after:absolute after:inset-0 after:z-0">
                <span className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <ChainIcon size={16} />
                </span>
                <span>
                  <span className="text-portal-text1 block text-[13px] font-bold">
                    {sequence.name}
                  </span>
                  {sequence.description && (
                    <span className="text-portal-text3 mt-0.5 block text-[11px]">
                      {sequence.description}
                    </span>
                  )}
                </span>
              </AppLink>
            </td>
            <td className="py-3.5 pr-4">
              <SequenceChainChips sequence={sequence} />
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px] whitespace-nowrap">
              {sequence.sets}
            </td>
            <td className="relative z-10 py-3.5 text-right">
              <button
                type="button"
                onClick={() => onEdit(sequence)}
                className="border-portal-border text-portal-text2 hover:bg-portal-card rounded-lg border px-3 py-1 text-xs font-semibold">
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SequenceListShell({
  sequences,
  deleteAction,
  createAction,
  updateDetailsAction,
}: {
  sequences: LibrarySequenceWithDetails[];
  deleteAction: (id: string) => Promise<ActionResult>;
  updateDetailsAction: (
    id: string,
    details: SequenceDetails,
  ) => Promise<ActionResult>;
  createAction: (
    input: SequenceInput,
  ) => Promise<ActionResult & { id?: string }>;
}) {
  const router = useRouter();
  const { showError } = useToast();
  const { items, mutate } = useOptimisticList(sequences);
  const [search, setSearch] = useState("");
  const filtered = items.filter((s) =>
    matchesSearch(search, s.name, s.description),
  );
  const [creating, setCreating] = useState(false);
  const create = () => setCreating(true);
  const [editing, setEditing] = useState<LibrarySequenceWithDetails | null>(
    null,
  );

  // A new sequence starts with the usual blank grid; the coach fills it in
  // on its own page.
  async function handleCreate(details: SequenceDetails) {
    const result = await createAction(
      toSequenceInput({ ...blankDraft(), ...details }),
    );
    if (result.ok && result.id) {
      router.push(`/sequences/${result.id}`);
      return true;
    }
    showError(result.error ?? "Failed to create sequence.");
    return false;
  }

  async function handleSave(details: SequenceDetails) {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const result = await mutate(
      (prev) => prev.map((s) => (s.id === id ? { ...s, ...details } : s)),
      () => updateDetailsAction(id, details),
    );
    if (!result.ok) showError(result.error ?? "Failed to save changes.");
  }

  async function handleDelete() {
    if (!editing) return false;
    const id = editing.id;
    setEditing(null);
    const result = await mutate(
      (prev) => prev.filter((s) => s.id !== id),
      () => deleteAction(id),
    );
    if (!result.ok) showError(result.error ?? "Failed to delete sequence.");
    return result.ok;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Sequences"
        subtitle="Chain exercises into one drill that's tracked as a single item"
      />
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sequences…"
        onCreate={create}
      />
      <div className="flex-1 overflow-y-auto px-7 py-2">
        {filtered.length === 0 ? (
          <EmptyState hasSearch={items.length > 0} onCreate={create} />
        ) : (
          <SequenceTable sequences={filtered} onEdit={setEditing} />
        )}
      </div>
      {editing && (
        <SequenceEditDrawer
          details={{ name: editing.name, description: editing.description }}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
      {creating && (
        <SequenceCreateModal
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
