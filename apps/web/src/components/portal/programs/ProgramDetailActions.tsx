"use client";

import type { FormSummary, ProgramRow } from "@hooper/db";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import {
  ProgramEditDrawer,
  type ProgramEditFormData,
} from "./ProgramEditDrawer";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface ProgramDetailActionsProps {
  program: ProgramRow;
  forms: FormSummary[];
  updateAction: (
    id: string,
    data: ProgramEditFormData,
  ) => Promise<ActionResult<ProgramRow>>;
  deleteAction: (id: string) => Promise<ActionResult>;
  publishAction: (id: string) => Promise<ActionResult<ProgramRow>>;
  attachFormAction: (
    programId: string,
    formId: string | null,
  ) => Promise<ActionResult<ProgramRow>>;
  /** Rendered immediately to the left of the "Edit program" button. */
  shortcutsButton?: ReactNode;
}

export function ProgramDetailActions({
  program,
  forms,
  updateAction,
  deleteAction,
  publishAction,
  attachFormAction,
  shortcutsButton,
}: ProgramDetailActionsProps) {
  const router = useRouter();
  const { showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(program);

  async function handleSave(data: ProgramEditFormData) {
    const previous = current;
    // Close the drawer straight away and patch our local copy, then reconcile
    // with the row the action returns. The page's <PageHeader> is a server
    // component so its title still catches up on the refresh, but the drawer
    // (and any reopen) reflects the edit immediately and rolls back on error.
    setCurrent((c) => ({
      ...c,
      name: data.name,
      description: data.description ?? null,
      notes: data.notes ?? null,
    }));
    setEditing(false);
    const result = await updateAction(previous.id, data);
    if (result.ok && result.data) {
      setCurrent(result.data);
      router.refresh();
    } else {
      setCurrent(previous);
      setEditing(true);
      showError(result.error ?? "Failed to save changes.");
    }
  }

  async function handlePublish() {
    const result = await publishAction(current.id);
    if (result.ok && result.data) setCurrent(result.data);
    router.refresh();
  }

  async function handleDelete() {
    await deleteAction(current.id);
    router.push("/programs");
  }

  async function handleAttachForm(formId: string | null) {
    const result = await attachFormAction(current.id, formId);
    if (result.ok && result.data) setCurrent(result.data);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {shortcutsButton}
      <PortalButton variant="secondary" onClick={() => setEditing(true)}>
        Edit program
      </PortalButton>
      {editing && (
        <ProgramEditDrawer
          program={current}
          forms={forms}
          onClose={() => setEditing(false)}
          onSave={handleSave}
          onPublish={handlePublish}
          onDelete={handleDelete}
          onAttachForm={handleAttachForm}
        />
      )}
    </div>
  );
}
