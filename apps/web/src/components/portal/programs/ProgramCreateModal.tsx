"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";
import { NumberStepper } from "./NumberStepper";

export type ProgramCreateFormData = {
  name: string;
  description?: string;
  notes?: string;
  weeks: number;
};

interface ProgramCreateModalProps {
  onClose: () => void;
  onCreate: (data: ProgramCreateFormData) => Promise<void>;
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
      <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
        Create program
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

interface ModalFieldsProps {
  name: string;
  onName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
  weeks: number;
  onWeeks: (v: number) => void;
}

function ModalFields({
  name,
  onName,
  description,
  onDescription,
  notes,
  onNotes,
  weeks,
  onWeeks,
}: ModalFieldsProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <PortalInput
        label="Program name"
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="e.g. Off-Season Athletic Base"
        autoFocus
      />
      <PortalTextarea
        label="Description (optional)"
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        placeholder="What's this program for?"
        rows={2}
      />
      <PortalTextarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="e.g. Do things at this tempo, rest 90s between sets…"
        rows={2}
      />
      <NumberStepper
        label="Duration (weeks)"
        value={weeks}
        onChange={onWeeks}
        min={1}
        max={52}
      />
      <p className="text-portal-text3 text-xs">
        You&apos;ll add sessions individually after creating the program — weeks
        is just a planning target for now.
      </p>
    </div>
  );
}

function ModalFooter({
  onClose,
  onCreate,
  saving,
  disabled,
}: {
  onClose: () => void;
  onCreate: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
      <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton variant="primary" onClick={onCreate} disabled={disabled}>
        {saving ? "Creating…" : "Create program"}
      </PortalButton>
    </div>
  );
}

export function ProgramCreateModal({
  onClose,
  onCreate,
}: ProgramCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      weeks,
    });
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader onClose={onClose} />
        <ModalFields
          name={name}
          onName={setName}
          description={description}
          onDescription={setDescription}
          notes={notes}
          onNotes={setNotes}
          weeks={weeks}
          onWeeks={setWeeks}
        />
        <ModalFooter
          onClose={onClose}
          onCreate={handleCreate}
          saving={saving}
          disabled={saving || !name.trim()}
        />
      </div>
    </div>
  );
}
