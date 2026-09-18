"use client";

import type { AssignedProgramRef } from "@hooper/db";
import { useOptimisticList } from "../ui/useOptimisticList";

type ActionResult = { ok: boolean; error?: string };

/** Optimistic "assigned programs" list shared by the athlete and team detail
 * pages — the row appears/disappears the instant the assign modal acts,
 * instead of after the close-then-refresh round-trip (see
 * router-refresh-modal-gap). `allPrograms` supplies the name for a
 * newly-assigned program, which the assign action itself doesn't return. */
export function useProgramAssignments(
  initial: AssignedProgramRef[],
  allPrograms: { id: string; name: string }[],
  assign: (programId: string) => Promise<ActionResult>,
  unassign: (programId: string) => Promise<ActionResult>,
) {
  const { items: assignedPrograms, mutate } = useOptimisticList(initial);

  async function assignProgram(programId: string): Promise<ActionResult> {
    const program = allPrograms.find((p) => p.id === programId);
    return mutate(
      (prev) =>
        program && !prev.some((p) => p.id === programId)
          ? [...prev, { id: program.id, name: program.name }]
          : prev,
      () => assign(programId),
    );
  }

  async function unassignProgram(programId: string): Promise<ActionResult> {
    return mutate(
      (prev) => prev.filter((p) => p.id !== programId),
      () => unassign(programId),
    );
  }

  return { assignedPrograms, assignProgram, unassignProgram };
}
