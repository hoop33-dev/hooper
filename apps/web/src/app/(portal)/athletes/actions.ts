"use server";

import {
  listAssignmentsForPlayer,
  listAssignmentsForTeam,
  revokeAssignment,
} from "@/src/services/assignment.service";
import {
  listAthletesForCoach,
  lookupAthleteByUsername,
} from "@/src/services/athlete.service";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  renameTeam,
} from "@/src/services/team.service";
import type {
  AssignmentWithProgram,
  AthleteMatch,
  AthleteSummary,
  TeamRow,
} from "@hooper/db";
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

export async function listAthletesForCoachAction(
  coachId: string,
): Promise<ActionResult<AthleteSummary[]>> {
  const result = await listAthletesForCoach(coachId);
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function listAssignmentsForPlayerAction(
  playerId: string,
): Promise<ActionResult<AssignmentWithProgram[]>> {
  const result = await listAssignmentsForPlayer(playerId);
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function listAssignmentsForTeamAction(
  teamId: string,
): Promise<ActionResult<AssignmentWithProgram[]>> {
  const result = await listAssignmentsForTeam(teamId);
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function revokeAssignmentAction(
  id: string,
): Promise<ActionResult> {
  const result = await revokeAssignment(id);
  if (result.ok) revalidateAthleteRoutes();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
