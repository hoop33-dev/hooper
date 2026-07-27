"use server";

import {
  assignProgramToAthlete,
  unassignProgramFromAthlete,
} from "@/src/services/athlete.service";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string };

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
