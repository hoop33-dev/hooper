"use client";

import type { ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { ModalHeader } from "../ui/ModalHeader";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface AssignProgramPickerModalProps {
  /** e.g. "Assign a program to Joe's Team" or "Assign a program to Jordan Taylor" */
  title: string;
  programs: ProgramSummary[];
  onClose: () => void;
  onAssign: (programId: string, startDate: string) => Promise<void>;
}

function ProgramPicker({
  programs,
  programId,
  onChange,
}: {
  programs: ProgramSummary[];
  programId: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  if (programs.length === 0) {
    return (
      <p className="text-portal-text3 text-xs">
        You don&apos;t have any programs yet. Create one from the Programs page
        first.
      </p>
    );
  }

  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <PortalInput
        label="Program"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search programs by name…"
      />
      <div className="border-portal-border max-h-48 overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <p className="text-portal-text3 p-3 text-xs">
            No programs match that search.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onChange(p.id)}
                  className={`border-portal-border cursor-pointer border-b last:border-b-0 ${
                    p.id === programId
                      ? "bg-portal-orange-soft"
                      : "hover:bg-portal-bg"
                  }`}>
                  <td className="text-portal-text1 px-3 py-2 text-[13px] font-bold">
                    {p.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function AssignProgramPickerModal({
  title,
  programs,
  onClose,
  onAssign,
}: AssignProgramPickerModalProps) {
  const [programId, setProgramId] = useState("");
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [assigning, setAssigning] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleAssign() {
    if (!programId || assigning) return;
    setAssigning(true);
    await onAssign(programId, startDate);
    setAssigning(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-md rounded-2xl shadow-2xl">
        <ModalHeader title={title} onClose={onClose} />

        <div className="flex flex-col gap-4 px-6 py-5">
          <ProgramPicker
            programs={programs}
            programId={programId}
            onChange={setProgramId}
          />

          <PortalInput
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={assigning}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleAssign}
            disabled={!programId || assigning}>
            {assigning ? "Assigning…" : "Assign"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
