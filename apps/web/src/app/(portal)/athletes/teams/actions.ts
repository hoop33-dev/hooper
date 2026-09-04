"use server";

import {
  addTeamMember,
  assignProgramToTeam,
  createTeam,
  deleteTeam,
  removeTeamMember,
  unassignProgramFromTeam,
  updateTeam,
  type CreateTeamInput,
  type UpdateTeamInput,
} from "@/src/services/team.service";
import type { TeamRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export async function createTeamAction(
  data: CreateTeamInput,
): Promise<ActionResult<TeamRow>> {
  const result = await createTeam(data);
  if (result.ok) revalidatePath("/athletes/teams");
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateTeamAction(
  id: string,
  data: UpdateTeamInput,
): Promise<ActionResult<TeamRow>> {
  const result = await updateTeam(id, data);
  if (result.ok) {
    revalidatePath("/athletes/teams");
    revalidatePath(`/athletes/teams/${id}`);
  }
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  const result = await deleteTeam(id);
  if (result.ok) revalidatePath("/athletes/teams");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addTeamMemberAction(
  teamId: string,
  profileId: string,
): Promise<ActionResult> {
  const result = await addTeamMember(teamId, profileId);
  if (result.ok) {
    revalidatePath("/athletes/teams");
    revalidatePath(`/athletes/teams/${teamId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function removeTeamMemberAction(
  teamId: string,
  profileId: string,
): Promise<ActionResult> {
  const result = await removeTeamMember(teamId, profileId);
  if (result.ok) {
    revalidatePath("/athletes/teams");
    revalidatePath(`/athletes/teams/${teamId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function assignProgramToTeamAction(
  teamId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await assignProgramToTeam(teamId, programId);
  if (result.ok) {
    revalidatePath("/athletes/teams");
    revalidatePath(`/athletes/teams/${teamId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function unassignProgramFromTeamAction(
  teamId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await unassignProgramFromTeam(teamId, programId);
  if (result.ok) {
    revalidatePath("/athletes/teams");
    revalidatePath(`/athletes/teams/${teamId}`);
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
