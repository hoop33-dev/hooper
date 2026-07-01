"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { NumberStepper } from "./NumberStepper";

export type ProgramCreateFormData = {
  name: string;
  description?: string;
  weeks: number;
  sessions_per_week: number;
};

interface ProgramCreateModalProps {
  onClose: () => void;
  onCreate: (data: ProgramCreateFormData) => Promise<void>;
}

function SummaryPill({
  weeks,
  sessionsPerWeek,
}: {
  weeks: number;
  sessionsPerWeek: number;
}) {
  const stats: [number, string][] = [
    [weeks, "Weeks"],
    [sessionsPerWeek, "Per week"],
    [weeks * sessionsPerWeek, "Target sessions"],
  ];
  return (
    <div className="border-portal-border bg-portal-bg flex items-center rounded-xl border px-5 py-3.5">
      {stats.map(([value, label], i) => (
        <div key={label} className="flex flex-1 items-center">
          {i > 0 && <div className="bg-portal-border mx-4 h-9 w-px" />}
          <div className="flex-1 text-center">
            <div className="font-title text-portal-orange text-2xl leading-none font-black">
              {value}
            </div>
            <div className="text-portal-text3 mt-1 text-[10px] tracking-wide uppercase">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
  weeks: number;
  onWeeks: (v: number) => void;
  sessionsPerWeek: number;
  onSessionsPerWeek: (v: number) => void;
}

function ModalFields({
  name,
  onName,
  description,
  onDescription,
  weeks,
  onWeeks,
  sessionsPerWeek,
  onSessionsPerWeek,
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
      <div className="grid grid-cols-2 gap-4">
        <NumberStepper
          label="Duration (weeks)"
          value={weeks}
          onChange={onWeeks}
          min={1}
          max={52}
        />
        <NumberStepper
          label="Sessions per week"
          value={sessionsPerWeek}
          onChange={onSessionsPerWeek}
          min={1}
          max={7}
        />
      </div>
      <SummaryPill weeks={weeks} sessionsPerWeek={sessionsPerWeek} />
      <p className="text-portal-text3 text-xs">
        You&apos;ll add sessions individually after creating the program — weeks
        and sessions/week are just a planning target for now.
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
  const [weeks, setWeeks] = useState(8);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      weeks,
      sessions_per_week: sessionsPerWeek,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader onClose={onClose} />
        <ModalFields
          name={name}
          onName={setName}
          description={description}
          onDescription={setDescription}
          weeks={weeks}
          onWeeks={setWeeks}
          sessionsPerWeek={sessionsPerWeek}
          onSessionsPerWeek={setSessionsPerWeek}
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
