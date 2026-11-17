import { SequenceListShell } from "@/src/components/portal/sequences/SequenceListShell";
import { listSequences } from "@/src/services/sequence.service";
import {
  createSequenceAction,
  deleteSequenceAction,
  updateSequenceDetailsAction,
} from "./actions";

export default async function SequencesPage() {
  const result = await listSequences();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SequenceListShell
        sequences={result.ok ? result.data : []}
        deleteAction={deleteSequenceAction}
        createAction={createSequenceAction}
        updateDetailsAction={updateSequenceDetailsAction}
      />
    </div>
  );
}
