import { getAncestorProgramIds } from "@/src/lib/programLineage";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { ProgramRow, ProgramSummary } from "@hooper/db";
import { listPrograms, updateProgram } from "./program.service";
import {
  copySessionIntoWeek,
  fetchSourceSessionsForWeeks,
} from "./session.service";

export type CopyProgramWeeksInput = {
  sourceProgramId: string;
  destinationProgramId: string;
  /** week_number values in the SOURCE program the coach selected. */
  sourceWeekNumbers: number[];
};

/** Every program eligible to import into `destinationProgramId` right
 * now — every program except itself and any program that's already
 * (directly or transitively) one of its ancestors, since importing one
 * of those would close a loop. */
export async function listEligibleImportSources(
  destinationProgramId: string,
): Promise<Result<ProgramSummary[]>> {
  try {
    const supabase = await createClient();
    const [programsResult, edgesResult] = await Promise.all([
      listPrograms(),
      supabase
        .from("program_sources")
        .select("source_program_id, destination_program_id"),
    ]);
    if (!programsResult.ok) return err(programsResult.error);
    if (edgesResult.error) return err(edgesResult.error.message);

    const ancestors = getAncestorProgramIds(
      destinationProgramId,
      edgesResult.data ?? [],
    );
    const eligible = programsResult.data.filter(
      (p) => p.id !== destinationProgramId && !ancestors.has(p.id),
    );
    return ok(eligible);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Deep-copies the selected source weeks' sessions/blocks/exercises/
 * measurements onto the end of the destination program, bumps its
 * `weeks` count, and records the copy-lineage edge. Re-checks the cycle
 * guard itself rather than trusting whatever the picker rendered. */
export async function copyProgramWeeks(
  input: CopyProgramWeeksInput,
): Promise<Result<ProgramRow>> {
  try {
    const { sourceProgramId, destinationProgramId } = input;
    if (sourceProgramId === destinationProgramId) {
      return err("A program can't be imported into itself.");
    }
    if (input.sourceWeekNumbers.length === 0) {
      return err("Select at least one week to import.");
    }

    const supabase = await createClient();

    const { data: edges, error: edgesError } = await supabase
      .from("program_sources")
      .select("source_program_id, destination_program_id");
    if (edgesError) return err(edgesError.message);

    const ancestors = getAncestorProgramIds(destinationProgramId, edges ?? []);
    if (ancestors.has(sourceProgramId)) {
      return err(
        "That program already contains this one — importing it here would create a loop.",
      );
    }

    const { data: destProgram, error: destError } = await supabase
      .from("programs")
      .select("weeks")
      .eq("id", destinationProgramId)
      .single();
    if (destError) return err(destError.message);

    const { data: sourceProgram, error: sourceError } = await supabase
      .from("programs")
      .select("weeks")
      .eq("id", sourceProgramId)
      .single();
    if (sourceError) return err(sourceError.message);

    const sortedWeeks = [...new Set(input.sourceWeekNumbers)].sort(
      (a, b) => a - b,
    );
    const invalidWeek = sortedWeeks.find(
      (w) => w < 1 || w > sourceProgram.weeks,
    );
    if (invalidWeek !== undefined) {
      return err(`Week ${invalidWeek} no longer exists on that program.`);
    }

    const weekNumberMap = new Map<number, number>(
      sortedWeeks.map((sourceWeek, index) => [
        sourceWeek,
        destProgram.weeks + index + 1,
      ]),
    );

    const sourceSessions = await fetchSourceSessionsForWeeks(
      supabase,
      sourceProgramId,
      sortedWeeks,
    );

    for (const session of sourceSessions) {
      const targetWeek = weekNumberMap.get(session.week_number);
      if (targetWeek === undefined) continue;
      const result = await copySessionIntoWeek(
        supabase,
        session,
        destinationProgramId,
        targetWeek,
      );
      if (!result.ok) return err(result.error);
    }

    const updateResult = await updateProgram(destinationProgramId, {
      weeks: destProgram.weeks + sortedWeeks.length,
    });
    if (!updateResult.ok) return err(updateResult.error);

    const { error: edgeInsertError } = await supabase
      .from("program_sources")
      .insert({
        source_program_id: sourceProgramId,
        destination_program_id: destinationProgramId,
      });
    if (edgeInsertError) return err(edgeInsertError.message);

    return ok(updateResult.data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
