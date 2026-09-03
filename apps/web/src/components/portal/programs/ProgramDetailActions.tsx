"use client";

import type { FormSummary, ProgramRow } from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast, type StickyToast } from "../ui/Toast";
import {
  ProgramEditDrawer,
  type ProgramEditFormData,
} from "./ProgramEditDrawer";
import { ProgramExportModal } from "./ProgramExportModal";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

/** Fetches the PDF in the background (the modal has already closed) — which
 * generates it and warms the browser HTTP cache — then opens a new tab to the
 * same URL once it's ready. The second request is served from cache, so the
 * tab shows the PDF instantly and with the route's `Content-Disposition`
 * filename. Opens automatically when the browser allows it, otherwise via an
 * "Open" button on the toast (a fresh gesture, so never popup-blocked). */
async function runPdfExport(
  url: string,
  progress: StickyToast,
  onError: (message: string) => void,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6 * 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    await res.arrayBuffer(); // drain the body so the full response is cached
    const win = window.open(url, "_blank");
    if (win) {
      progress.resolve("PDF opened in a new tab.");
    } else {
      progress.resolve("Your PDF is ready.", {
        label: "Open",
        onClick: () => window.open(url, "_blank"),
      });
    }
  } catch {
    progress.dismiss();
    onError("Couldn't generate the PDF. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

interface ProgramDetailActionsProps {
  program: ProgramRow;
  /** The signed-in coach's name, prefilled into the PDF export modal. */
  coachName: string;
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
  coachName,
  forms,
  updateAction,
  deleteAction,
  publishAction,
  attachFormAction,
  shortcutsButton,
}: ProgramDetailActionsProps) {
  const router = useRouter();
  const { showError, showSticky } = useToast();
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [current, setCurrent] = useState(program);

  function handleExport(queryString: string) {
    // A fresh nonce per export so the browser never serves a stale PDF from
    // its HTTP cache after the coach edits the program and re-exports with
    // the same options. The route ignores unknown params; its short-lived
    // cache entry still bridges the fetch below to the new-tab navigation
    // (both hit this exact URL), it just can't be reused by a later export.
    const nonce =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    void runPdfExport(
      `/api/programs/${current.id}/export?${queryString}&_=${nonce}`,
      showSticky("Generating your PDF…"),
      showError,
    );
  }

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
        <PortalButton variant="secondary" onClick={() => setExporting(true)}>
          Export PDF
        </PortalButton>
        <PortalButton variant="secondary" onClick={() => setEditing(true)}>
          Edit program
        </PortalButton>
      </div>
      {exporting && (
        <ProgramExportModal
          totalWeeks={current.weeks}
          programNotes={current.notes ?? ""}
          defaultCoachName={coachName}
          onGenerate={handleExport}
          onClose={() => setExporting(false)}
        />
      )}
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
