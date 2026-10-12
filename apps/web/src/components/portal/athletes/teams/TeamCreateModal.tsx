"use client";

import { useMemo, useState } from "react";
import { PortalButton } from "../../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../../ui/PortalInput";
import { useModalDismiss } from "../../ui/useModalDismiss";
import { AvatarPicker } from "../AvatarPicker";

export type TeamCreateFormData = {
  name: string;
  description?: string;
  avatarFile?: File;
};

type CreateResult = { ok: boolean; error?: string };

interface TeamCreateModalProps {
  onClose: () => void;
  onCreate: (data: TeamCreateFormData) => Promise<CreateResult>;
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
      <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
        Create team
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export function TeamCreateModal({ onClose, onCreate }: TeamCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onBackdropClick = useModalDismiss(onClose);

  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const result = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      avatarFile,
    });
    setSaving(false);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? "Failed to create team.");
    }
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader onClose={onClose} />
        <div className="flex flex-col gap-4 px-6 py-5">
          <AvatarPicker
            previewUrl={previewUrl}
            fallbackLabel={name || "T"}
            onFileSelected={setAvatarFile}
          />
          <PortalInput
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. U16 Squad"
            autoFocus
          />
          <PortalTextarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this team for?"
            rows={2}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
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
