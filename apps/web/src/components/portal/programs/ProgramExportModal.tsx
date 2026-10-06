"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";
import { WeekSelectGrid } from "./WeekSelectGrid";

interface ProgramExportModalProps {
  /** Total weeks in the program — the week grid runs 1..totalWeeks. */
  totalWeeks: number;
  /** Prefill for the notes textarea — the program's stored `notes`. */
  programNotes: string;
  /** Prefill for the coach field — the signed-in coach's name. */
  defaultCoachName: string;
  /** Kicks off generation with the built query string (`coach=…&athlete=…`).
   * The parent owns the request so it survives the modal closing. */
  onGenerate: (queryString: string) => void;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

interface ModalFieldsProps {
  coach: string;
  onCoach: (v: string) => void;
  athlete: string;
  onAthlete: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
  totalWeeks: number;
  weeks: number[];
  onToggleWeek: (w: number) => void;
}

function ModalFields({
  coach,
  onCoach,
  athlete,
  onAthlete,
  notes,
  onNotes,
  totalWeeks,
  weeks,
  onToggleWeek,
}: ModalFieldsProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <PortalInput
        label="Coach name"
        value={coach}
        onChange={(e) => onCoach(e.target.value)}
        placeholder="Your name"
        autoFocus
      />
      <PortalInput
        label="Athlete name"
        value={athlete}
        onChange={(e) => onAthlete(e.target.value)}
        placeholder="Who's this copy for?"
      />
      <PortalTextarea
        label="Program notes for the athlete"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        rows={4}
        placeholder="Intent, priorities, how to load it, what to report back…"
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-portal-text2 text-xs font-bold">Weeks</span>
          <span className="text-portal-text3 text-xs">
            {weeks.length} of {totalWeeks} selected
          </span>
        </div>
        <WeekSelectGrid
          totalWeeks={totalWeeks}
          selected={weeks}
          onToggle={onToggleWeek}
        />
      </div>

      <p className="text-portal-text3 text-xs">
        Sessions, exercises and sets come straight from the program. The PDF
        opens in a new tab once it&apos;s generated.
      </p>
    </div>
  );
}

export function ProgramExportModal({
  totalWeeks,
  programNotes,
  defaultCoachName,
  onGenerate,
  onClose,
}: ProgramExportModalProps) {
  const allWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const [coach, setCoach] = useState(defaultCoachName);
  const [athlete, setAthlete] = useState("");
  const [notes, setNotes] = useState(programNotes);
  const [weeks, setWeeks] = useState<number[]>(allWeeks);
  const onBackdropClick = useModalDismiss(onClose);

  function toggleWeek(w: number) {
    setWeeks((cur) =>
      cur.includes(w)
        ? // Keep at least one week selected.
          cur.length === 1
          ? cur
          : cur.filter((x) => x !== w)
        : [...cur, w].sort((a, b) => a - b),
    );
  }

  function handleGenerate() {
    const qs = new URLSearchParams({
      coach: coach.trim(),
      athlete: athlete.trim(),
      notes: notes.trim(),
    });
    // Omit the param when the whole program is selected — the route defaults
    // to every week.
    if (weeks.length < totalWeeks) qs.set("weeks", weeks.join(","));
    onGenerate(qs.toString());
    onClose();
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
            Export program PDF
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
            <CloseIcon />
          </button>
        </div>

        <ModalFields
          coach={coach}
          onCoach={setCoach}
          athlete={athlete}
          onAthlete={setAthlete}
          notes={notes}
          onNotes={setNotes}
          totalWeeks={totalWeeks}
          weeks={weeks}
          onToggleWeek={toggleWeek}
        />

        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleGenerate}
            disabled={weeks.length === 0}>
            Generate PDF
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
