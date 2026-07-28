"use client";

import type { AthleteSummary } from "@hooper/db";
import { useMemo, useState } from "react";
import { XIcon } from "../../ui/icons";
import { PortalButton } from "../../ui/PortalButton";
import { PortalInput } from "../../ui/PortalInput";
import { useModalDismiss } from "../../ui/useModalDismiss";

type ActionResult = { ok: boolean; error?: string };

interface AddTeamMembersModalProps {
  candidates: AthleteSummary[];
  onSubmit: (profileIds: string[]) => Promise<ActionResult>;
  onClose: () => void;
}

const MAX_RESULTS = 10;

function athleteName(athlete: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}): string {
  return (
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    athlete.username ||
    "Unnamed athlete"
  );
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/** Custom-drawn instead of relying on the native checkbox — see the same
 * note in WeekAddModal.tsx's WeekCheckbox. */
function AthleteCheckbox({ checked }: { checked: boolean }) {
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
  athlete,
  selected,
  onToggle,
}: {
  athlete: AthleteSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  const age = athlete.date_of_birth
    ? calculateAge(athlete.date_of_birth)
    : null;
  const meta = [
    athlete.username ? `@${athlete.username}` : null,
    age !== null ? `${age}y` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left ${
        selected
          ? "border-portal-orange bg-portal-orange-soft"
          : "border-portal-border hover:bg-portal-bg"
      }`}>
      <AthleteCheckbox checked={selected} />
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-xs font-bold">
          {athleteName(athlete)}
        </div>
        {meta && (
          <div className="text-portal-text3 truncate text-[11px]">{meta}</div>
        )}
      </div>
    </button>
  );
}

function SelectedPill({
  athlete,
  onRemove,
}: {
  athlete: AthleteSummary;
  onRemove: () => void;
}) {
  return (
    <span className="bg-portal-border/60 text-portal-text1 inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs font-semibold">
      {athleteName(athlete)}
      <button
        type="button"
        onClick={onRemove}
        className="text-portal-text3 flex h-4 w-4 items-center justify-center rounded-full hover:text-red-500">
        <XIcon size={9} />
      </button>
    </span>
  );
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
      <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
        Add athletes
      </h2>
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
  filtered: AthleteSummary[];
  selectedIds: string[];
  selected: AthleteSummary[];
  onToggle: (id: string) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
      <PortalInput
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search athletes by name…"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {search.trim().length > 0 &&
        (filtered.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {filtered.map((athlete) => (
              <CandidateRow
                key={athlete.id}
                athlete={athlete}
                selected={selectedIds.includes(athlete.id)}
                onToggle={() => onToggle(athlete.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-portal-text3 px-1 text-xs">
            No matching athletes.
          </p>
        ))}

      {selected.length > 0 && (
        <div className="border-portal-border flex flex-wrap gap-1.5 border-t pt-3">
          {selected.map((athlete) => (
            <SelectedPill
              key={athlete.id}
              athlete={athlete}
              onRemove={() => onToggle(athlete.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModalFooter({
  selectedCount,
  saving,
  onClose,
  onSubmit,
}: {
  selectedCount: number;
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
        disabled={selectedCount === 0 || saving}>
        {saving
          ? "Adding…"
          : `Add ${selectedCount} athlete${selectedCount === 1 ? "" : "s"}`}
      </PortalButton>
    </div>
  );
}

export function AddTeamMembersModal({
  candidates,
  onSubmit,
  onClose,
}: AddTeamMembersModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onBackdropClick = useModalDismiss(onClose);

  const candidateById = useMemo(
    () => new Map(candidates.map((a) => [a.id, a])),
    [candidates],
  );

  const filtered =
    search.trim().length === 0
      ? []
      : candidates
          .filter((a) =>
            athleteName(a).toLowerCase().includes(search.trim().toLowerCase()),
          )
          .slice(0, MAX_RESULTS);

  function toggle(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  async function handleSubmit() {
    if (selectedIds.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    const result = await onSubmit(selectedIds);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Failed to add athletes.");
      return;
    }
    onClose();
  }

  const selected = selectedIds
    .map((id) => candidateById.get(id))
    .filter((a): a is AthleteSummary => a !== undefined);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl">
        <ModalHeader onClose={onClose} />
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
          selectedCount={selectedIds.length}
          saving={saving}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
