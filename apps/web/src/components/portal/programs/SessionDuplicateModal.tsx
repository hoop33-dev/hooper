"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";

export type DuplicatePattern =
  | "every"
  | "every2"
  | "every3"
  | "every4"
  | "manual";

interface SessionDuplicateModalProps {
  sessionName: string;
  sourceWeek: number;
  totalWeeks: number;
  onClose: () => void;
  onDuplicate: (targetWeeks: number[]) => Promise<void>;
}

const PATTERNS: { id: DuplicatePattern; label: string }[] = [
  { id: "every", label: "Every week" },
  { id: "every2", label: "Every 2nd week" },
  { id: "every3", label: "Every 3rd week" },
  { id: "every4", label: "Every 4th week" },
  { id: "manual", label: "Manual" },
];

function weeksForPattern(
  pattern: DuplicatePattern,
  total: number,
  sourceWeek: number,
): number[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  if (pattern === "every") return all;
  if (pattern === "every2") return all.filter((w) => w % 2 === 0);
  if (pattern === "every3") return all.filter((w) => w % 3 === 0);
  if (pattern === "every4") return all.filter((w) => w % 4 === 0);
  return [sourceWeek];
}

function PatternButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
        active
          ? "border-portal-orange bg-portal-orange-soft text-portal-orange"
          : "border-portal-border text-portal-text1"
      }`}>
      {label}
    </button>
  );
}

function WeekGrid({
  totalWeeks,
  sourceWeek,
  selected,
  onToggle,
}: {
  totalWeeks: number;
  sourceWeek: number;
  selected: number[];
  onToggle: (w: number) => void;
}) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {weeks.map((w) => {
        const isSelected = selected.includes(w);
        const isSource = w === sourceWeek;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onToggle(w)}
            className={`relative h-11 rounded-lg border text-xs font-bold ${
              isSelected
                ? "border-portal-orange bg-portal-orange-soft text-portal-orange"
                : "border-portal-border text-portal-text2"
            }`}>
            {isSource && (
              <span className="bg-portal-orange absolute top-1 right-1 h-1 w-1 rounded-full" />
            )}
            Wk {w}
          </button>
        );
      })}
    </div>
  );
}

function ModalHeader({
  sessionName,
  sourceWeek,
}: {
  sessionName: string;
  sourceWeek: number;
}) {
  return (
    <div className="border-portal-border border-b px-5 py-4">
      <h2 className="font-title text-portal-text1 text-base font-extrabold tracking-wide">
        Duplicate session
      </h2>
      <p className="text-portal-text3 mt-0.5 text-xs">
        {sessionName} · Week {sourceWeek}
      </p>
    </div>
  );
}

interface ModalBodyProps {
  pattern: DuplicatePattern;
  onPattern: (p: DuplicatePattern) => void;
  totalWeeks: number;
  sourceWeek: number;
  selected: number[];
  onToggleWeek: (w: number) => void;
}

function ModalBody({
  pattern,
  onPattern,
  totalWeeks,
  sourceWeek,
  selected,
  onToggleWeek,
}: ModalBodyProps) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div>
        <div className="text-portal-text2 mb-2 text-xs font-bold">
          Repeat pattern
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PATTERNS.map((p) => (
            <PatternButton
              key={p.id}
              label={p.label}
              active={pattern === p.id}
              onClick={() => onPattern(p.id)}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-portal-text2 text-xs font-bold">Weeks</span>
          <span className="text-portal-text3 text-xs">
            {selected.length} of {totalWeeks} selected
          </span>
        </div>
        <WeekGrid
          totalWeeks={totalWeeks}
          sourceWeek={sourceWeek}
          selected={selected}
          onToggle={onToggleWeek}
        />
      </div>
    </div>
  );
}

function ModalFooter({
  selectedCount,
  onClose,
  onSubmit,
  saving,
}: {
  selectedCount: number;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border flex items-center gap-2 border-t px-5 py-4">
      <span className="text-portal-text3 flex-1 text-xs">
        {selectedCount} cop{selectedCount !== 1 ? "ies" : "y"} will be created
      </span>
      <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        variant="primary"
        onClick={onSubmit}
        disabled={saving || selectedCount === 0}>
        {saving
          ? "Duplicating…"
          : `Duplicate to ${selectedCount} week${selectedCount !== 1 ? "s" : ""}`}
      </PortalButton>
    </div>
  );
}

export function SessionDuplicateModal({
  sessionName,
  sourceWeek,
  totalWeeks,
  onClose,
  onDuplicate,
}: SessionDuplicateModalProps) {
  const [pattern, setPattern] = useState<DuplicatePattern>("every2");
  const [selected, setSelected] = useState<number[]>(() =>
    weeksForPattern("every2", totalWeeks, sourceWeek),
  );
  const [saving, setSaving] = useState(false);

  function handlePattern(p: DuplicatePattern) {
    setPattern(p);
    setSelected(weeksForPattern(p, totalWeeks, sourceWeek));
  }

  function toggleWeek(w: number) {
    setPattern("manual");
    setSelected((s) =>
      s.includes(w)
        ? s.filter((x) => x !== w)
        : [...s, w].sort((a, b) => a - b),
    );
  }

  async function handleSubmit() {
    if (selected.length === 0 || saving) return;
    setSaving(true);
    await onDuplicate(selected);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader sessionName={sessionName} sourceWeek={sourceWeek} />
        <ModalBody
          pattern={pattern}
          onPattern={handlePattern}
          totalWeeks={totalWeeks}
          sourceWeek={sourceWeek}
          selected={selected}
          onToggleWeek={toggleWeek}
        />
        <ModalFooter
          selectedCount={selected.length}
          onClose={onClose}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </div>
  );
}
