"use client";

import type { FormSummary, ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

export type ProgramEditFormData = {
  name: string;
  description?: string;
  notes?: string;
};

interface ProgramEditDrawerProps {
  program: ProgramSummary;
  forms: FormSummary[];
  onClose: () => void;
  onSave: (data: ProgramEditFormData) => Promise<void>;
  onPublish: () => Promise<void>;
  onDelete: () => Promise<void>;
  onAttachForm: (formId: string | null) => Promise<void>;
}

function FormPicker({
  forms,
  attachedFormId,
  onAttachForm,
}: {
  forms: FormSummary[];
  attachedFormId: string | null;
  onAttachForm: (formId: string | null) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const attachedForm = forms.find((f) => f.id === attachedFormId) ?? null;

  const filtered =
    search.trim().length === 0
      ? []
      : forms.filter((f) =>
          f.name.toLowerCase().includes(search.trim().toLowerCase()),
        );

  async function handlePick(formId: string | null) {
    setSaving(true);
    await onAttachForm(formId);
    setSaving(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-portal-text2 text-xs font-semibold">Form (optional)</p>
      {attachedForm ? (
        <div className="border-portal-border bg-portal-bg flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-portal-text1 flex-1 truncate text-xs font-semibold">
            {attachedForm.name}
          </span>
          <button
            type="button"
            onClick={() => handlePick(null)}
            disabled={saving}
            title="Remove form"
            className="text-portal-text3 hover:text-portal-text1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md disabled:opacity-40">
            <XIcon />
          </button>
        </div>
      ) : (
        <>
          <PortalInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search forms by name…"
          />
          {filtered.length > 0 && (
            <div className="border-portal-border max-h-40 overflow-y-auto rounded-lg border">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handlePick(f.id)}
                  disabled={saving}
                  className="border-portal-border hover:bg-portal-bg text-portal-text1 flex w-full items-center border-b px-3 py-2 text-left text-xs font-semibold last:border-b-0 disabled:opacity-50">
                  {f.name}
                </button>
              ))}
            </div>
          )}
          {search.trim().length > 0 && filtered.length === 0 && (
            <p className="text-portal-text3 text-xs">No matching forms.</p>
          )}
        </>
      )}
    </div>
  );
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
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await onPublish();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="border-portal-border mt-1 border-t pt-4">
      <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
        Danger zone
      </div>
      {status === "draft" && (
        <InlineConfirmBar
          idleLabel="Publish this program"
          confirmLabel="Publish this program?"
          confirmActionLabel="Publish"
          onConfirm={handlePublish}
          loading={publishing}
          tone="success"
          className="mb-2"
        />
      )}
      <InlineConfirmBar
        idleLabel="Delete this program"
        confirmLabel="Delete this program?"
        onConfirm={handleDelete}
        loading={deleting}
      />
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
  notes: string;
  onNotes: (v: string) => void;
  program: ProgramSummary;
  forms: FormSummary[];
  onPublish: () => Promise<void>;
  onDelete: () => Promise<void>;
  onAttachForm: (formId: string | null) => Promise<void>;
}

function DrawerFields({
  name,
  onName,
  description,
  onDescription,
  notes,
  onNotes,
  program,
  forms,
  onPublish,
  onDelete,
  onAttachForm,
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
      <PortalTextarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="e.g. Do things at this tempo, rest 90s between sets…"
        rows={2}
      />
      <FormPicker
        forms={forms}
        attachedFormId={program.form_id}
        onAttachForm={onAttachForm}
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
  forms,
  onClose,
  onSave,
  onPublish,
  onDelete,
  onAttachForm,
}: ProgramEditDrawerProps) {
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [notes, setNotes] = useState(program.notes ?? "");
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleSave() {
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
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
          notes={notes}
          onNotes={setNotes}
          program={program}
          forms={forms}
          onPublish={onPublish}
          onDelete={onDelete}
          onAttachForm={onAttachForm}
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
