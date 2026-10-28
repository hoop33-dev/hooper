"use server";

import {
  assignProgramToAthlete,
  unassignProgramFromAthlete,
  updateAthleteProfile,
  type AthleteProfileFields,
} from "@/src/services/athlete.service";
import {
  retryAthletePayment,
  sendAthletePasswordReset,
} from "@/src/services/athleteBilling.service";
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
    revalidateAthletePage();
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
    revalidateAthletePage();
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
  revalidateAthletePage();
  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
}

export async function updateAthleteProfileAction(
  profileId: string,
  fields: AthleteProfileFields,
): Promise<ActionResult> {
  const result = await updateAthleteProfile(profileId, fields);
  if (result.ok) {
    revalidatePath("/athletes");
    revalidateAthletePage();
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function sendAthletePasswordResetAction(
  profileId: string,
): Promise<ActionResult> {
  const result = await sendAthletePasswordReset(profileId);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function retryAthletePaymentAction(
  profileId: string,
  purchaseId: string,
): Promise<ActionResult> {
  const result = await retryAthletePayment(profileId, purchaseId);
  // Revalidated either way: a decline still changes the invoice's attempts.
  revalidatePath(`/athletes/${profileId}/billing`);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** The athlete page's header, tabs and context load in the `[id]` layout,
 * so edits refresh that layout. A "layout" revalidation matches the route
 * pattern, not a concrete `/athletes/<id>` URL — this refreshes every
 * athlete's page, which is cheap. */
function revalidateAthletePage() {
  revalidatePath("/athletes/[id]", "layout");
}
