"use client";

import type { SessionRow } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";

export type SessionCreateData =
  | { mode: "blank"; name: string; week_number: number }
  | { mode: "copy"; sourceSessionId: string; week_number: number };

interface SessionCreateModalProps {
  weekNumber: number;
  existingSessions: SessionRow[];
  onClose: () => void;
  onCreate: (data: SessionCreateData) => Promise<void>;
}

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

function CopySourceList({
  sessions,
  sourceId,
  onSelect,
}: {
  sessions: SessionRow[];
  sourceId: string | null;
  onSelect: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="border-portal-border text-portal-text3 rounded-lg border p-3 text-center text-xs">
        No sessions to copy yet
      </div>
    );
  }
  return (
    <div className="border-portal-border max-h-40 overflow-y-auto rounded-lg border">
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`border-portal-border flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 ${
            sourceId === s.id ? "bg-portal-orange-soft" : ""
          }`}>
          <span className="text-portal-text1 text-xs font-semibold">
            {s.name}
          </span>
          <span className="text-portal-text3 ml-auto flex-shrink-0 text-[10px]">
            Week {s.week_number}
          </span>
        </button>
      ))}
    </div>
  );
}

function ModalHeader({
  weekNumber,
  onClose,
}: {
  weekNumber: number;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
      <div>
        <div className="text-portal-text3 text-[10px] font-bold tracking-wider uppercase">
          Week {weekNumber}
        </div>
        <h2 className="font-title text-portal-text1 text-base font-extrabold tracking-wide">
          Add session
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="border-portal-border text-portal-text2 flex h-7 w-7 items-center justify-center rounded-full border">
        ×
      </button>
    </div>
  );
}

interface ModalBodyProps {
  mode: "blank" | "copy";
  onMode: (m: "blank" | "copy") => void;
  name: string;
  onName: (v: string) => void;
  existingSessions: SessionRow[];
  sourceId: string | null;
  onSourceId: (id: string) => void;
}

function ModalBody({
  mode,
  onMode,
  name,
  onName,
  existingSessions,
  sourceId,
  onSourceId,
}: ModalBodyProps) {
  return (
    <div className="flex flex-col gap-3.5 px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        <StartModeOption
          label="Blank session"
          description="Start with empty blocks"
          active={mode === "blank"}
          onClick={() => onMode("blank")}
        />
        <StartModeOption
          label="Copy existing"
          description="Duplicate a previous session"
          active={mode === "copy"}
          onClick={() => onMode("copy")}
        />
      </div>
      {mode === "blank" ? (
        <PortalInput
          label="Session name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="e.g. Upper Body Power"
          autoFocus
        />
      ) : (
        <CopySourceList
          sessions={existingSessions}
          sourceId={sourceId}
          onSelect={onSourceId}
        />
      )}
    </div>
  );
}

export function SessionCreateModal({
  weekNumber,
  existingSessions,
  onClose,
  onCreate,
}: SessionCreateModalProps) {
  const [mode, setMode] = useState<"blank" | "copy">("blank");
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit =
    mode === "blank" ? name.trim().length > 0 : sourceId !== null;

  async function handleCreate() {
    if (!canSubmit || saving) return;
    setSaving(true);
    if (mode === "blank") {
      await onCreate({
        mode: "blank",
        name: name.trim(),
        week_number: weekNumber,
      });
    } else if (sourceId) {
      await onCreate({
        mode: "copy",
        sourceSessionId: sourceId,
        week_number: weekNumber,
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card w-full max-w-md rounded-2xl shadow-2xl">
        <ModalHeader weekNumber={weekNumber} onClose={onClose} />
        <ModalBody
          mode={mode}
          onMode={setMode}
          name={name}
          onName={setName}
          existingSessions={existingSessions}
          sourceId={sourceId}
          onSourceId={setSourceId}
        />
        <div className="border-portal-border flex justify-end gap-2 border-t px-5 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleCreate}
            disabled={!canSubmit || saving}>
            {saving ? "Adding…" : "Add session"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
