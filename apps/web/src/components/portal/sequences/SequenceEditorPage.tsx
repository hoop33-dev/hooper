"use client";

import type { SequenceInput } from "@/src/services/sequence.service";
import type { UnitTypeRow } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { SequenceRunOrder } from "./SequenceChain";
import type { SequenceDetails } from "./SequenceCreateModal";
import { toSequenceInput, type EditorSequence } from "./sequenceDraft";
import { SequenceEditDrawer } from "./SequenceEditDrawer";
import { SequenceGrid, SequenceLegend } from "./SequenceGrid";
import { SequenceHeader } from "./SequenceHeader";
import type { SequenceExerciseLibrary } from "./SequenceStepPicker";
import {
  useSequenceEditor,
  type SequenceEditorActions,
} from "./useSequenceEditor";

type ActionResult = { ok: boolean; error?: string; id?: string };

/** Name/description live in the Edit drawer; this saves them on their own,
 * without touching unsaved changes in the grid. */
function useDetailsDrawer(
  actions: SequenceEditorActions,
  updateDetailsAction: (details: SequenceDetails) => Promise<ActionResult>,
  deleteAction: () => Promise<ActionResult>,
) {
  const router = useRouter();
  const { showError } = useToast();
  const [open, setOpen] = useState(false);

  async function save(details: SequenceDetails) {
    const result = await updateDetailsAction(details);
    if (!result.ok) {
      showError(result.error ?? "Failed to save changes.");
      return;
    }
    actions.setName(details.name);
    actions.setDescription(details.description ?? "");
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    const result = await deleteAction();
    if (!result.ok) {
      showError(result.error ?? "Failed to delete sequence.");
      return false;
    }
    router.push("/sequences");
    return true;
  }

  return { open, setOpen, save, remove };
}

/** Full-page editor for a library sequence's steps, sets and tracking. */
export function SequenceEditorPage({
  initial,
  library,
  unitTypes,
  saveAction,
  updateDetailsAction,
  deleteAction,
}: {
  initial: EditorSequence;
  library: SequenceExerciseLibrary;
  unitTypes: UnitTypeRow[];
  saveAction: (input: SequenceInput) => Promise<ActionResult>;
  updateDetailsAction: (details: SequenceDetails) => Promise<ActionResult>;
  deleteAction: () => Promise<ActionResult>;
}) {
  const { showError, showSuccess } = useToast();
  const { draft, actions } = useSequenceEditor(initial);
  const [saving, setSaving] = useState(false);
  const drawer = useDetailsDrawer(actions, updateDetailsAction, deleteAction);
  const exercisesById = useMemo(
    () => new Map(library.exercises.map((e) => [e.id, e])),
    [library.exercises],
  );

  async function save() {
    setSaving(true);
    const result = await saveAction(toSequenceInput(draft));
    setSaving(false);
    if (result.ok) showSuccess(`Saved "${draft.name}".`);
    else showError(result.error ?? "Failed to save sequence.");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={draft.name}
        subtitle={draft.description ?? undefined}
        backHref="/sequences"
        breadcrumbs={[
          { label: "Sequences", href: "/sequences" },
          { label: draft.name },
        ]}
        action={
          <div className="flex gap-2">
            <PortalButton onClick={() => drawer.setOpen(true)}>
              Edit
            </PortalButton>
            <PortalButton variant="primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save sequence"}
            </PortalButton>
          </div>
        }
      />
      <div className="border-portal-border bg-portal-card flex-shrink-0 border-b px-7 py-4">
        <SequenceHeader draft={draft} actions={actions} unitTypes={unitTypes} />
      </div>
      <div className="bg-portal-bg flex flex-1 flex-col gap-3 overflow-y-auto px-7 py-4">
        <SequenceGrid draft={draft} actions={actions} library={library} />
        <SequenceLegend />
        <SequenceRunOrder draft={draft} exercisesById={exercisesById} />
      </div>
      {drawer.open && (
        <SequenceEditDrawer
          details={{ name: draft.name, description: draft.description }}
          onClose={() => drawer.setOpen(false)}
          onSave={drawer.save}
          onDelete={drawer.remove}
        />
      )}
    </div>
  );
}
