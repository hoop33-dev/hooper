"use client";

import { useState } from "react";
import { ModalHeader } from "../ui/ModalHeader";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

interface TeamCreateModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function TeamCreateModal({ onClose, onCreate }: TeamCreateModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onCreate(name.trim());
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-md rounded-2xl shadow-2xl">
        <ModalHeader title="Create team" onClose={onClose} />

        <div className="flex flex-col gap-4 px-6 py-5">
          <PortalInput
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Varsity Boys"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
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
            {saving ? "Creating…" : "Create team"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
