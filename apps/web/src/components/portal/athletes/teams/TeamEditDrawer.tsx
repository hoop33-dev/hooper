"use client";

import type { TeamDetail } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmBar } from "../../ui/InlineConfirmBar";
import { PortalButton } from "../../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../../ui/PortalInput";
import { XIcon } from "../../ui/icons";
import { useModalDismiss } from "../../ui/useModalDismiss";
import { AvatarPicker } from "../AvatarPicker";

interface TeamEditDrawerProps {
  team: TeamDetail;
  name: string;
  onName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  saving: boolean;
  uploadingAvatar: boolean;
  error: string | null;
  dirty: boolean;
  onSave: () => void;
  onAvatarSelected: (file: File) => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function DrawerHeader({
  teamName,
  onClose,
}: {
  teamName: string;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-5">
      <div>
        <div className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
          Team details
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">{teamName}</div>
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
        idleLabel="Delete this team"
        confirmLabel="Delete this team?"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

function DrawerFields({
  team,
  name,
  onName,
  description,
  onDescription,
  uploadingAvatar,
  error,
  onAvatarSelected,
  onDelete,
}: {
  team: TeamDetail;
  name: string;
  onName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  uploadingAvatar: boolean;
  error: string | null;
  onAvatarSelected: (file: File) => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      <AvatarPicker
        previewUrl={team.avatar_url}
        fallbackLabel={team.name}
        onFileSelected={onAvatarSelected}
        uploading={uploadingAvatar}
      />
      <PortalInput
        label="Team name"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />
      <PortalTextarea
        label="Description (optional)"
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        rows={2}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <DangerZone onDelete={onDelete} />
    </div>
  );
}

export function TeamEditDrawer({
  team,
  name,
  onName,
  description,
  onDescription,
  saving,
  uploadingAvatar,
  error,
  dirty,
  onSave,
  onAvatarSelected,
  onDelete,
  onClose,
}: TeamEditDrawerProps) {
  const onBackdropClick = useModalDismiss(onClose);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="bg-portal-card flex h-full w-full max-w-md flex-col shadow-2xl">
        <DrawerHeader teamName={team.name} onClose={onClose} />
        <DrawerFields
          team={team}
          name={name}
          onName={onName}
          description={description}
          onDescription={onDescription}
          uploadingAvatar={uploadingAvatar}
          error={error}
          onAvatarSelected={onAvatarSelected}
          onDelete={onDelete}
        />
        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Discard
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={onSave}
            disabled={!dirty || saving || !name.trim()}>
            {saving ? "Saving…" : "Save changes"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
