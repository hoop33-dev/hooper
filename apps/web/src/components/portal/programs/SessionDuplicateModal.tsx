"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useModalDismiss } from "../ui/useModalDismiss";
import { WeekSelectGrid } from "./WeekSelectGrid";

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
  /** The session's current linked weeks, including its own — just
   * `[sourceWeek]` when it isn't linked to anything yet. */
  linkedWeeks: number[];
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

const PATTERN_STEPS: Partial<Record<DuplicatePattern, number>> = {
  every: 1,
  every2: 2,
  every3: 3,
  every4: 4,
};

/** Weeks are relative to the session's own week — "every 2nd week" from
 * week 3 means 1, 3, 5, 7…, not every even-numbered week. */
function weeksForPattern(
  pattern: DuplicatePattern,
  total: number,
  sourceWeek: number,
): number[] {
  const step = PATTERN_STEPS[pattern];
  if (!step) return [sourceWeek];
  const all = Array.from({ length: total }, (_, i) => i + 1);
  return all.filter((w) => (w - sourceWeek) % step === 0);
}

function sameWeeks(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((w) => setB.has(w));
}

/** Which pattern (if any) the session's existing linked weeks match, so
 * reopening the modal reflects reality instead of always defaulting to
 * "every 2nd week". */
function detectPattern(
  linkedWeeks: number[],
  sourceWeek: number,
  totalWeeks: number,
): DuplicatePattern {
  const candidates: DuplicatePattern[] = [
    "every",
    "every2",
    "every3",
    "every4",
  ];
  for (const p of candidates) {
    if (sameWeeks(weeksForPattern(p, totalWeeks, sourceWeek), linkedWeeks)) {
      return p;
    }
  }
  return "manual";
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

function ModalHeader({
  sessionName,
  sourceWeek,
  alreadyLinked,
}: {
  sessionName: string;
  sourceWeek: number;
  alreadyLinked: boolean;
}) {
  return (
    <div className="border-portal-border border-b px-5 py-4">
      <h2 className="font-title text-portal-text1 text-base font-extrabold tracking-wide">
        {alreadyLinked ? "Linked weeks" : "Duplicate session"}
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
        <WeekSelectGrid
          totalWeeks={totalWeeks}
          lockedWeek={sourceWeek}
          lockedTitle="This session's own week"
          selected={selected}
          onToggle={onToggleWeek}
        />
      </div>
    </div>
  );
}

function ModalFooter({
  selectedCount,
  alreadyLinked,
  onClose,
  onSubmit,
  saving,
}: {
  selectedCount: number;
  alreadyLinked: boolean;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border flex items-center gap-2 border-t px-5 py-4">
      <span className="text-portal-text3 flex-1 text-xs">
        {alreadyLinked
          ? `Linked across ${selectedCount} week${selectedCount !== 1 ? "s" : ""}`
          : `${selectedCount} cop${selectedCount !== 1 ? "ies" : "y"} will be created`}
      </span>
      <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        variant="primary"
        onClick={onSubmit}
        disabled={saving || selectedCount === 0}>
        {saving
          ? alreadyLinked
            ? "Updating…"
            : "Duplicating…"
          : alreadyLinked
            ? "Update linked weeks"
            : `Duplicate to ${selectedCount} week${selectedCount !== 1 ? "s" : ""}`}
      </PortalButton>
    </div>
  );
}

// Whatever pattern/manual selection produces, the session's own week always
// stays part of it — it can't be removed through this modal (that's what
// the session's own delete button is for).
function withSourceWeek(weeks: number[], sourceWeek: number): number[] {
  return weeks.includes(sourceWeek)
    ? weeks
    : [...weeks, sourceWeek].sort((a, b) => a - b);
}

export function SessionDuplicateModal({
  sessionName,
  sourceWeek,
  totalWeeks,
  linkedWeeks,
  onClose,
  onDuplicate,
}: SessionDuplicateModalProps) {
  const alreadyLinked = linkedWeeks.length > 1;
  const [pattern, setPattern] = useState<DuplicatePattern>(() =>
    alreadyLinked
      ? detectPattern(linkedWeeks, sourceWeek, totalWeeks)
      : "manual",
  );
  const [selected, setSelected] = useState<number[]>(() =>
    alreadyLinked ? linkedWeeks : [sourceWeek],
  );
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  function handlePattern(p: DuplicatePattern) {
    setPattern(p);
    setSelected(
      withSourceWeek(weeksForPattern(p, totalWeeks, sourceWeek), sourceWeek),
    );
  }

  function toggleWeek(w: number) {
    if (w === sourceWeek) return;
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
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader
          sessionName={sessionName}
          sourceWeek={sourceWeek}
          alreadyLinked={alreadyLinked}
        />
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
          alreadyLinked={alreadyLinked}
          onClose={onClose}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </div>
  );
}
