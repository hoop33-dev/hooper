"use client";

import type { ProgramSummary } from "@hooper/db";
import { useMemo, useState } from "react";
import { XIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

type ActionResult = { ok: boolean; error?: string };

interface AssignProgramsModalProps {
  entityName: string;
  assignedProgramIds: string[];
  allPrograms: ProgramSummary[];
  onAssign: (programId: string) => Promise<ActionResult>;
  onUnassign: (programId: string) => Promise<ActionResult>;
  onClose: () => void;
}

const MAX_RESULTS = 10;

/** Custom-drawn instead of relying on the native checkbox — see the same
 * note in WeekAddModal.tsx's WeekCheckbox. */
function ProgramCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="relative inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-sm border ${
          checked
            ? "border-portal-orange bg-portal-orange"
            : "border-portal-border bg-white"
        }`}
      />
      {checked && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute h-2.5 w-2.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  );
}

function CandidateRow({
  program,
  selected,
  onToggle,
}: {
  program: ProgramSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left ${
        selected
          ? "border-portal-orange bg-portal-orange-soft"
          : "border-portal-border hover:bg-portal-bg"
      }`}>
      <ProgramCheckbox checked={selected} />
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-xs font-bold">
          {program.name}
        </div>
      </div>
    </button>
  );
}

function SelectedPill({
  program,
  onRemove,
}: {
  program: ProgramSummary;
  onRemove: () => void;
}) {
  return (
    <span className="bg-portal-border/60 text-portal-text1 inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs font-semibold">
      {program.name}
      <button
        type="button"
        onClick={onRemove}
        className="text-portal-text3 flex h-4 w-4 items-center justify-center rounded-full hover:text-red-500">
        <XIcon size={9} />
      </button>
    </span>
  );
}

function ModalHeader({
  entityName,
  onClose,
}: {
  entityName: string;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
      <div>
        <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
          Assign programs
        </h2>
        <div className="text-portal-text3 mt-0.5 text-xs">{entityName}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="border-portal-border text-portal-text2 flex h-8 w-8 items-center justify-center rounded-full border">
        <XIcon />
      </button>
    </div>
  );
}

function ModalBody({
  search,
  onSearch,
  filtered,
  selectedIds,
  selected,
  onToggle,
  error,
}: {
  search: string;
  onSearch: (v: string) => void;
  filtered: ProgramSummary[];
  selectedIds: string[];
  selected: ProgramSummary[];
  onToggle: (id: string) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
      <PortalInput
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search programs by name…"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {search.trim().length > 0 &&
        (filtered.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {filtered.map((program) => (
              <CandidateRow
                key={program.id}
                program={program}
                selected={selectedIds.includes(program.id)}
                onToggle={() => onToggle(program.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-portal-text3 px-1 text-xs">
            No matching programs.
          </p>
        ))}

      {selected.length > 0 && (
        <div className="border-portal-border flex flex-wrap gap-1.5 border-t pt-3">
          {selected.map((program) => (
            <SelectedPill
              key={program.id}
              program={program}
              onRemove={() => onToggle(program.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModalFooter({
  dirty,
  saving,
  onClose,
  onSubmit,
}: {
  dirty: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
      <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        variant="primary"
        onClick={onSubmit}
        disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save changes"}
      </PortalButton>
    </div>
  );
}

export function AssignProgramsModal({
  entityName,
  assignedProgramIds,
  allPrograms,
  onAssign,
  onUnassign,
  onClose,
}: AssignProgramsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedProgramIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onBackdropClick = useModalDismiss(onClose);

  const initialIds = useMemo(
    () => new Set(assignedProgramIds),
    [assignedProgramIds],
  );
  const programById = useMemo(
    () => new Map(allPrograms.map((p) => [p.id, p])),
    [allPrograms],
  );

  const filtered =
    search.trim().length === 0
      ? []
      : allPrograms
          .filter((p) =>
            p.name.toLowerCase().includes(search.trim().toLowerCase()),
          )
          .slice(0, MAX_RESULTS);

  function toggle(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  const toAdd = selectedIds.filter((id) => !initialIds.has(id));
  const toRemove = [...initialIds].filter((id) => !selectedIds.includes(id));
  const dirty = toAdd.length > 0 || toRemove.length > 0;

  async function handleSubmit() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    const results = await Promise.all([
      ...toAdd.map((id) => onAssign(id)),
      ...toRemove.map((id) => onUnassign(id)),
    ]);
    setSaving(false);
    const failed = results.find((r) => !r.ok);
    if (failed) {
      setError(failed.error ?? "Failed to update programs.");
      return;
    }
    onClose();
  }

  const selected = selectedIds
    .map((id) => programById.get(id))
    .filter((p): p is ProgramSummary => p !== undefined);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl">
        <ModalHeader entityName={entityName} onClose={onClose} />
        <ModalBody
          search={search}
          onSearch={setSearch}
          filtered={filtered}
          selectedIds={selectedIds}
          selected={selected}
          onToggle={toggle}
          error={error}
        />
        <ModalFooter
          dirty={dirty}
          saving={saving}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
