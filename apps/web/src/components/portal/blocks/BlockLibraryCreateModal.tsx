"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

interface BlockLibraryCreateModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function BlockLibraryCreateModal({
  onClose,
  onCreate,
}: BlockLibraryCreateModalProps) {
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
      <div className="bg-portal-card w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
            New template
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
            label="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Warm-Up or Upper Body Session"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <p className="text-portal-text3 text-xs">
            Add blocks and exercises after creating it — a template with one
            block can be dragged into any session; several blocks makes it a
            whole reusable session.
          </p>
        </div>
        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleCreate}
            disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create template"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
