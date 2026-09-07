"use server";

import {
  assignProgramToAthlete,
  unassignProgramFromAthlete,
} from "@/src/services/athlete.service";
import { listPrograms } from "@/src/services/program.service";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string };

/** Just the fields the "Assign programs" modal needs. Loaded lazily when the
 * modal opens rather than on every athlete / team detail page render. */
export async function listAssignableProgramsAction(): Promise<
  { id: string; name: string }[]
> {
  const result = await listPrograms();
  return result.ok ? result.data.map((p) => ({ id: p.id, name: p.name })) : [];
}

export async function assignProgramToAthleteAction(
  profileId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await assignProgramToAthlete(profileId, programId);
  if (result.ok) {
    revalidatePath("/athletes");
    revalidatePath(`/athletes/${profileId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function unassignProgramFromAthleteAction(
  profileId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await unassignProgramFromAthlete(profileId, programId);
  if (result.ok) {
    revalidatePath("/athletes");
    revalidatePath(`/athletes/${profileId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
