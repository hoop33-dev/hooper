"use server";

import { lookupAthleteByUsername } from "@/src/services/athlete.service";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  renameTeam,
} from "@/src/services/team.service";
import type { AthleteMatch, TeamRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function revalidateAthleteRoutes() {
  revalidatePath("/athletes", "page");
  revalidatePath("/athletes/[teamId]", "page");
}

export async function createTeamAction(
  name: string,
  createdBy: string,
): Promise<ActionResult<TeamRow>> {
  const result = await createTeam(name, createdBy);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function renameTeamAction(
  id: string,
  name: string,
): Promise<ActionResult<TeamRow>> {
  const result = await renameTeam(id, name);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  const result = await deleteTeam(id);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addTeamMemberAction(
  teamId: string,
  playerId: string,
): Promise<ActionResult> {
  const result = await addTeamMember(teamId, playerId);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function removeTeamMemberAction(
  teamId: string,
  playerId: string,
): Promise<ActionResult> {
  const result = await removeTeamMember(teamId, playerId);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function lookupAthleteByUsernameAction(
  username: string,
): Promise<ActionResult<AthleteMatch | null>> {
  const result = await lookupAthleteByUsername(username);
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}
