"use server";

import {
  assignProgramToAthlete,
  unassignProgramFromAthlete,
} from "@/src/services/athlete.service";
import { addTeamMember, removeTeamMember } from "@/src/services/team.service";
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

/** Team membership from the athlete's side — same writes as the team page's
 * member actions, but revalidating this athlete's page as well. */
export async function addAthleteToTeamAction(
  profileId: string,
  teamId: string,
): Promise<ActionResult> {
  const result = await addTeamMember(teamId, profileId);
  if (result.ok) revalidateMembership(profileId, teamId);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function removeAthleteFromTeamAction(
  profileId: string,
  teamId: string,
): Promise<ActionResult> {
  const result = await removeTeamMember(teamId, profileId);
  if (result.ok) revalidateMembership(profileId, teamId);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

function revalidateMembership(profileId: string, teamId: string) {
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${profileId}`);
  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
}
