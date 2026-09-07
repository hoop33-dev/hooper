"use client";

import type { FormRow } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

export type FormEditFormData = {
  name: string;
  description?: string | null;
};

interface FormEditDrawerProps {
  form: FormRow;
  onClose: () => void;
  onSave: (data: FormEditFormData) => Promise<void>;
  onDelete: () => Promise<void>;
}

function DangerZone({ onDelete }: { onDelete: () => Promise<void> }) {
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
      <InlineConfirmBar
        idleLabel="Delete this form"
        confirmLabel="Delete this form?"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

function DrawerHeader({
  formName,
  onClose,
}: {
  formName: string;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-5">
      <div>
        <div className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
          Form details
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">{formName}</div>
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

export function FormEditDrawer({
  form,
  onClose,
  onSave,
  onDelete,
}: FormEditDrawerProps) {
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? "");
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleSave() {
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
    });
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="bg-portal-card flex h-full w-full max-w-md flex-col shadow-2xl">
        <DrawerHeader formName={form.name} onClose={onClose} />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <PortalInput
            label="Form name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <PortalTextarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <DangerZone onDelete={onDelete} />
        </div>
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
