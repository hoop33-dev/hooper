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

/** The inverse of AssignProgramModal: there the program is fixed and you
 * pick a team/athlete; here the target (a specific team or athlete) is
 * fixed and you pick a program from the library. */
export function AssignProgramPickerModal({
  title,
  programs,
  onClose,
  onAssign,
}: AssignProgramPickerModalProps) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
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
          {programs.length === 0 ? (
            <p className="text-portal-text3 text-xs">
              You don&apos;t have any programs yet. Create one from the Programs
              page first.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-portal-text2 text-xs font-semibold">
                Program
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="border-portal-border bg-portal-card text-portal-text1 focus:border-portal-orange focus:ring-portal-orange h-9 w-full rounded-lg border px-3 text-sm focus:ring-1 focus:outline-none">
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
