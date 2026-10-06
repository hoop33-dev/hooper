"use client";

import { useState } from "react";
import { useToast } from "../ui/Toast";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";

type ActionResult = { ok: boolean; error?: string };

interface SaveSessionAsTemplateButtonProps {
  sessionName: string;
  saveAction: (name: string) => Promise<ActionResult>;
}

export function SaveSessionAsTemplateButton({
  sessionName,
  saveAction,
}: SaveSessionAsTemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const { showError, showSuccess } = useToast();

  async function handleSave(name: string) {
    const result = await saveAction(name);
    if (result.ok) {
      setOpen(false);
      showSuccess(`Saved "${name}" to the Block Library.`);
    } else {
      showError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-portal-text2 text-xs font-semibold hover:underline">
        Save as template
      </button>
      {open && (
        <SaveAsTemplatePopover
          title="Save session as template"
          defaultName={sessionName}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
