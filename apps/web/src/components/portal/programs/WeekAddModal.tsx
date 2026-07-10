"use client";

import type { ProgramSummary, ProgramWithSessions } from "@hooper/db";
import { useEffect, useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

interface WeekAddModalProps {
  eligibleSources: ProgramSummary[] | null;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  selectedSourceProgram: ProgramWithSessions | null;
  saving: boolean;
  onClose: () => void;
  onSubmitBlank: (count: number) => Promise<void>;
  onSubmitImport: (weekNumbers: number[]) => Promise<void>;
}

type Mode = "blank" | "import";

function StartModeOption({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-2.5 text-left ${
        active
          ? "border-portal-orange bg-portal-orange-soft"
          : "border-portal-border bg-portal-bg"
      }`}>
      <div
        className={`text-xs font-bold ${active ? "text-portal-orange" : "text-portal-text1"}`}>
        {label}
      </div>
      <div className="text-portal-text3 mt-0.5 text-[11px]">{description}</div>
    </button>
  );
}

function formatSourceMeta(program: ProgramSummary): string {
  const weeks = `${program.weeks} wk${program.weeks !== 1 ? "s" : ""}`;
  return `${weeks} · ${program.sessionCount} session${program.sessionCount !== 1 ? "s" : ""}`;
}

function SourceProgramList({
  sources,
  search,
  onSelect,
}: {
  sources: ProgramSummary[] | null;
  search: string;
  onSelect: (id: string) => void;
}) {
  if (sources === null) {
    return (
      <div className="border-portal-border text-portal-text3 rounded-lg border p-3 text-center text-xs">
        Loading programs…
      </div>
    );
  }

  const filtered = sources.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <div className="border-portal-border text-portal-text3 rounded-lg border p-3 text-center text-xs">
        No other programs available to import from
      </div>
    );
  }

  return (
    <div className="border-portal-border max-h-40 overflow-y-auto rounded-lg border">
      {filtered.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className="border-portal-border flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0">
          <span className="text-portal-text1 text-xs font-semibold">
            {p.name}
          </span>
          <span className="text-portal-text3 ml-auto flex-shrink-0 text-[10px]">
            {formatSourceMeta(p)}
          </span>
        </button>
      ))}
    </div>
  );
}

function sessionNamesByWeek(
  program: ProgramWithSessions,
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const session of program.sessions) {
    const names = map.get(session.week_number) ?? [];
    names.push(session.name);
    map.set(session.week_number, names);
  }
  return map;
}

/** Custom-drawn instead of relying on the native checkbox — see the same
 * note in BlockExerciseMeasurementModal.tsx's AthleteEnteredToggle. */
function WeekCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="relative mt-0.5 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
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

/** Only weeks that actually have sessions are worth importing — an empty
 * week wouldn't bring anything over, so it's left out of the picker
 * entirely rather than shown disabled. */
function WeekImportPicker({
  sourceProgram,
  selected,
  onToggle,
}: {
  sourceProgram: ProgramWithSessions;
  selected: number[];
  onToggle: (week: number) => void;
}) {
  const namesByWeek = sessionNamesByWeek(sourceProgram);
  const weeks = Array.from(
    { length: sourceProgram.weeks },
    (_, i) => i + 1,
  ).filter((w) => (namesByWeek.get(w)?.length ?? 0) > 0);

  if (weeks.length === 0) {
    return (
      <div className="border-portal-border text-portal-text3 rounded-lg border p-3 text-center text-xs">
        This program has no sessions to import
      </div>
    );
  }

  return (
    <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
      {weeks.map((w) => {
        const isSelected = selected.includes(w);
        const names = namesByWeek.get(w) ?? [];
        return (
          <button
            key={w}
            type="button"
            onClick={() => onToggle(w)}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left ${
              isSelected
                ? "border-portal-orange bg-portal-orange-soft"
                : "border-portal-border"
            }`}>
            <WeekCheckbox checked={isSelected} />
            <span
              className={`text-xs font-bold ${
                isSelected ? "text-portal-orange" : "text-portal-text2"
              }`}>
              Wk {w}
            </span>
            <span className="text-portal-text3 text-xs">
              {names.join(", ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ModalHeader() {
  return (
    <div className="border-portal-border border-b px-5 py-4">
      <h2 className="font-title text-portal-text1 text-base font-extrabold tracking-wide">
        Add week
      </h2>
    </div>
  );
}

interface ModalBodyProps {
  mode: Mode;
  onMode: (m: Mode) => void;
  blankCount: number;
  onBlankCount: (n: number) => void;
  eligibleSources: ProgramSummary[] | null;
  sourceSearch: string;
  onSourceSearch: (v: string) => void;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  selectedSourceProgram: ProgramWithSessions | null;
  selectedWeeks: number[];
  onToggleWeek: (week: number) => void;
}

function ImportSourcePicker({
  eligibleSources,
  sourceSearch,
  onSourceSearch,
  onSelectSource,
}: Pick<
  ModalBodyProps,
  "eligibleSources" | "sourceSearch" | "onSourceSearch" | "onSelectSource"
>) {
  return (
    <>
      <PortalInput
        placeholder="Search programs…"
        value={sourceSearch}
        onChange={(e) => onSourceSearch(e.target.value)}
        autoFocus
      />
      <SourceProgramList
        sources={eligibleSources}
        search={sourceSearch}
        onSelect={onSelectSource}
      />
    </>
  );
}

function ImportWeekSelector({
  selectedSourceProgram,
  selectedWeeks,
  onSelectSource,
  onToggleWeek,
}: Pick<
  ModalBodyProps,
  "selectedSourceProgram" | "selectedWeeks" | "onSelectSource" | "onToggleWeek"
>) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelectSource(null)}
        className="text-portal-text2 self-start text-xs font-semibold hover:underline">
        ← Choose a different program
      </button>
      {selectedSourceProgram ? (
        <>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-portal-text2 text-xs font-bold">
              Weeks to import
            </span>
            <span className="text-portal-text3 text-xs">
              {selectedWeeks.length} of{" "}
              {
                new Set(
                  selectedSourceProgram.sessions.map((s) => s.week_number),
                ).size
              }{" "}
              selected
            </span>
          </div>
          <WeekImportPicker
            sourceProgram={selectedSourceProgram}
            selected={selectedWeeks}
            onToggle={onToggleWeek}
          />
        </>
      ) : (
        <div className="border-portal-border text-portal-text3 rounded-lg border p-3 text-center text-xs">
          Loading weeks…
        </div>
      )}
    </>
  );
}

function ModalBody({
  mode,
  onMode,
  blankCount,
  onBlankCount,
  eligibleSources,
  sourceSearch,
  onSourceSearch,
  selectedSourceId,
  onSelectSource,
  selectedSourceProgram,
  selectedWeeks,
  onToggleWeek,
}: ModalBodyProps) {
  return (
    <div className="flex flex-col gap-3.5 px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        <StartModeOption
          label="Add blank weeks"
          description="Start with empty weeks"
          active={mode === "blank"}
          onClick={() => onMode("blank")}
        />
        <StartModeOption
          label="Import from another program"
          description="Copy weeks from a saved program"
          active={mode === "import"}
          onClick={() => onMode("import")}
        />
      </div>

      {mode === "blank" && (
        <PortalInput
          label="Number of weeks"
          type="number"
          min={1}
          value={blankCount}
          onChange={(e) =>
            onBlankCount(Math.max(1, Number(e.target.value) || 1))
          }
          autoFocus
        />
      )}

      {mode === "import" && selectedSourceId === null && (
        <ImportSourcePicker
          eligibleSources={eligibleSources}
          sourceSearch={sourceSearch}
          onSourceSearch={onSourceSearch}
          onSelectSource={onSelectSource}
        />
      )}

      {mode === "import" && selectedSourceId !== null && (
        <ImportWeekSelector
          selectedSourceProgram={selectedSourceProgram}
          selectedWeeks={selectedWeeks}
          onSelectSource={onSelectSource}
          onToggleWeek={onToggleWeek}
        />
      )}
    </div>
  );
}

function ModalFooter({
  mode,
  blankCount,
  selectedWeekCount,
  canSubmit,
  saving,
  onClose,
  onSubmit,
}: {
  mode: Mode;
  blankCount: number;
  selectedWeekCount: number;
  canSubmit: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-portal-border flex justify-end gap-2 border-t px-5 py-4">
      <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        variant="primary"
        onClick={onSubmit}
        disabled={!canSubmit || saving}>
        {saving
          ? "Adding…"
          : mode === "blank"
            ? `Add ${blankCount} week${blankCount !== 1 ? "s" : ""}`
            : `Import ${selectedWeekCount} week${selectedWeekCount !== 1 ? "s" : ""}`}
      </PortalButton>
    </div>
  );
}

export function WeekAddModal({
  eligibleSources,
  selectedSourceId,
  onSelectSource,
  selectedSourceProgram,
  saving,
  onClose,
  onSubmitBlank,
  onSubmitImport,
}: WeekAddModalProps) {
  const [mode, setMode] = useState<Mode>("blank");
  const [blankCount, setBlankCount] = useState(1);
  const [sourceSearch, setSourceSearch] = useState("");
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const onBackdropClick = useModalDismiss(onClose);

  useEffect(() => {
    if (selectedSourceProgram) {
      const weeksWithSessions = [
        ...new Set(selectedSourceProgram.sessions.map((s) => s.week_number)),
      ].sort((a, b) => a - b);
      setSelectedWeeks(weeksWithSessions);
    }
  }, [selectedSourceProgram]);

  function toggleWeek(week: number) {
    setSelectedWeeks((weeks) =>
      weeks.includes(week)
        ? weeks.filter((w) => w !== week)
        : [...weeks, week].sort((a, b) => a - b),
    );
  }

  const canSubmit =
    mode === "blank"
      ? blankCount >= 1
      : selectedSourceId !== null && selectedWeeks.length > 0;

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    if (mode === "blank") {
      await onSubmitBlank(blankCount);
    } else {
      await onSubmitImport(selectedWeeks);
    }
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader />
        <ModalBody
          mode={mode}
          onMode={setMode}
          blankCount={blankCount}
          onBlankCount={setBlankCount}
          eligibleSources={eligibleSources}
          sourceSearch={sourceSearch}
          onSourceSearch={setSourceSearch}
          selectedSourceId={selectedSourceId}
          onSelectSource={onSelectSource}
          selectedSourceProgram={selectedSourceProgram}
          selectedWeeks={selectedWeeks}
          onToggleWeek={toggleWeek}
        />
        <ModalFooter
          mode={mode}
          blankCount={blankCount}
          selectedWeekCount={selectedWeeks.length}
          canSubmit={canSubmit}
          saving={saving}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
