import { draftFromLibrary } from "@/src/components/portal/sequences/sequenceDraft";
import { SequenceEditorPage } from "@/src/components/portal/sequences/SequenceEditorPage";
import {
  getSequence,
  type SequenceInput,
} from "@/src/services/sequence.service";
import { notFound } from "next/navigation";
import {
  deleteSequenceAction,
  updateSequenceAction,
  updateSequenceDetailsAction,
} from "../actions";
import { loadSequenceEditorData } from "../sequenceEditorData";

export default async function SequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sequence, { library, unitTypes }] = await Promise.all([
    getSequence(id),
    loadSequenceEditorData(),
  ]);
  if (!sequence.ok) notFound();

  async function save(input: SequenceInput) {
    "use server";
    return updateSequenceAction(id, input);
  }

  async function updateDetails(details: {
    name: string;
    description: string | null;
  }) {
    "use server";
    return updateSequenceDetailsAction(id, details);
  }

  async function remove() {
    "use server";
    return deleteSequenceAction(id);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SequenceEditorPage
        initial={draftFromLibrary(sequence.data)}
        library={library}
        unitTypes={unitTypes}
        saveAction={save}
        updateDetailsAction={updateDetails}
        deleteAction={remove}
      />
    </div>
  );
}
