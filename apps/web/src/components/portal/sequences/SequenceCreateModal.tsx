"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

export type SequenceDetails = { name: string; description: string | null };

export function SequenceCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  /** Resolves true once created; the modal then stays saving while the shell
   * navigates to the new sequence. */
  onCreate: (details: SequenceDetails) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const created = await onCreate({
      name: name.trim(),
      description: description.trim() || null,
    });
    if (!created) setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
            New sequence
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
            <XIcon size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 py-5">
          <PortalInput
            label="Sequence name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wing attack"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <PortalTextarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Beat the closeout, swing it, relocate, finish"
          />
        </div>
        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleCreate}
            disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create sequence"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
