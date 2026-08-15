"use client";

import type { FormSummary, ProgramRow } from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
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
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(program);

  async function handleSave(data: ProgramEditFormData) {
    const result = await updateAction(current.id, data);
    if (result.ok) {
      setEditing(false);
      router.refresh();
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
    <div className="flex flex-col items-end gap-2">
      <Link
        href="/programs"
        className="text-portal-text2 text-xs font-semibold hover:underline">
        ← Back to programs
      </Link>
      <div className="flex items-center gap-2">
        {shortcutsButton}
        <PortalButton variant="secondary" onClick={() => setEditing(true)}>
          Edit program
        </PortalButton>
      </div>
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
