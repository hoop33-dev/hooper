"use client";

import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";

interface SaveAsTemplatePopoverProps {
  title: string;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export function SaveAsTemplatePopover({
  title,
  defaultName,
  onClose,
  onSave,
}: SaveAsTemplatePopoverProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card w-full max-w-xs rounded-xl p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-title text-portal-text1 text-sm font-extrabold tracking-wide">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="border-portal-border text-portal-text2 flex h-6 w-6 items-center justify-center rounded-full border">
            <XIcon size={9} />
          </button>
        </div>
        <PortalInput
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <div className="mt-3 flex justify-end gap-2">
          <PortalButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save to library"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
