import type { ProgramRow, ProgramSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

type AttachFormToProgramAction = (
  programId: string,
  formId: string | null,
) => Promise<ActionResult<ProgramRow>>;

/** Owns the optimistic local copy of `programs` for the attach/detach panel:
 * flips a program's form_id instantly on click, then reverts to the
 * pre-change snapshot only if the server rejects it — the same
 * instant-then-rollback shape useFormEditorState uses for question reorder. */
export function useProgramAttachments(
  formId: string,
  initialPrograms: ProgramSummary[],
  attachFormToProgramAction: AttachFormToProgramAction,
) {
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);

  useEffect(() => {
    setPrograms(initialPrograms);
  }, [initialPrograms]);

  async function setProgramFormId(
    programId: string,
    nextFormId: string | null,
  ) {
    const previous = programs;
    setPrograms((prev) =>
      prev.map((p) => (p.id === programId ? { ...p, form_id: nextFormId } : p)),
    );
    const result = await attachFormToProgramAction(programId, nextFormId);
    if (!result.ok) {
      setPrograms(previous);
      return;
    }
    router.refresh();
  }

  async function handleAttach(programId: string) {
    await setProgramFormId(programId, formId);
  }

  async function handleDetach(programId: string) {
    await setProgramFormId(programId, null);
  }

  return { programs, handleAttach, handleDetach };
}
