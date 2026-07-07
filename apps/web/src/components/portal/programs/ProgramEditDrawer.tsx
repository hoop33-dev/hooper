"use client";

import type { ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { SpinnerIcon, XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";
import { NumberStepper } from "./NumberStepper";

export type ProgramEditFormData = {
  name: string;
  description?: string;
  weeks: number;
};

interface ProgramEditDrawerProps {
  program: ProgramSummary;
  onClose: () => void;
  onSave: (data: ProgramEditFormData) => Promise<void>;
  onPublish: () => Promise<void>;
  onDelete: () => Promise<void>;
}

function DangerZone({
  status,
  onPublish,
  onDelete,
}: {
  status: ProgramSummary["status"];
  onPublish: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border-portal-border mt-1 border-t pt-4">
      <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
        Danger zone
      </div>
      {status === "draft" && (
        <PortalButton
          variant="secondary"
          className="mb-2 w-full justify-start"
          onClick={onPublish}>
          Publish this program
        </PortalButton>
      )}
      {confirming ? (
        <div className="flex h-9 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4">
          <span className="flex-1 text-sm text-red-700">
            Delete this program?
          </span>
          <PortalButton
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={deleting}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}>
            {deleting ? <SpinnerIcon size={12} /> : "Delete"}
          </PortalButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-left text-xs font-semibold text-red-500">
          Delete this program…
        </button>
      )}
    </div>
  );
}

function DrawerHeader({
  programName,
  onClose,
}: {
  programName: string;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-5">
      <div>
        <div className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
          Program details
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">{programName}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="border-portal-border text-portal-text2 flex h-8 w-8 items-center justify-center rounded-full border">
        <XIcon />
      </button>
    </div>
  );
}

interface DrawerFieldsProps {
  name: string;
  onName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  weeks: number;
  onWeeks: (v: number) => void;
  program: ProgramSummary;
  onPublish: () => Promise<void>;
  onDelete: () => Promise<void>;
}

function DrawerFields({
  name,
  onName,
  description,
  onDescription,
  weeks,
  onWeeks,
  program,
  onPublish,
  onDelete,
}: DrawerFieldsProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      <PortalInput
        label="Program name"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />
      <PortalTextarea
        label="Description (optional)"
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        rows={2}
      />
      <NumberStepper
        label="Duration (weeks)"
        value={weeks}
        onChange={onWeeks}
        min={1}
        max={52}
      />
      <DangerZone
        status={program.status}
        onPublish={onPublish}
        onDelete={onDelete}
      />
    </div>
  );
}

export function ProgramEditDrawer({
  program,
  onClose,
  onSave,
  onPublish,
  onDelete,
}: ProgramEditDrawerProps) {
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [weeks, setWeeks] = useState(program.weeks);
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleSave() {
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      weeks,
    });
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="bg-portal-card flex h-full w-full max-w-md flex-col shadow-2xl">
        <DrawerHeader programName={program.name} onClose={onClose} />
        <DrawerFields
          name={name}
          onName={setName}
          description={description}
          onDescription={setDescription}
          weeks={weeks}
          onWeeks={setWeeks}
          program={program}
          onPublish={onPublish}
          onDelete={onDelete}
        />
        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Discard
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save changes"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
