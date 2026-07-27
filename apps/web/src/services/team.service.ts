import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  AssignedProgramRef,
  ProfileRow,
  TeamDetail,
  TeamMember,
  TeamRow,
  TeamSummary,
} from "@hooper/db";

type ProgramTeamJoinRow = {
  team_id: string;
  programs: AssignedProgramRef | null;
};

async function fetchAssignedPrograms(
  teamIds: string[],
): Promise<Result<Map<string, AssignedProgramRef[]>>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_teams")
    .select("team_id, programs(id, name)")
    .in("team_id", teamIds);

  if (error) return err(error.message);

  const byTeam = new Map<string, AssignedProgramRef[]>();
  for (const row of (data ?? []) as unknown as ProgramTeamJoinRow[]) {
    if (!row.programs) continue;
    const list = byTeam.get(row.team_id) ?? [];
    list.push(row.programs);
    byTeam.set(row.team_id, list);
  }
  return ok(byTeam);
}

export type CreateTeamInput = {
  name: string;
  description?: string;
  created_by: string;
};

export type UpdateTeamInput = {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
};

export async function listTeams(): Promise<Result<TeamSummary[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*, team_members(count)")
      .order("name");
    if (error) return err(error.message);

    const teamIds = (data ?? []).map((row) => row.id);
    const programsResult = await fetchAssignedPrograms(teamIds);
    if (!programsResult.ok) return err(programsResult.error);

    const rows = (data ?? []).map((row) => {
      const memberCount = Array.isArray(row.team_members)
        ? ((row.team_members[0] as { count: number } | undefined)?.count ?? 0)
        : 0;
      return {
        ...row,
        memberCount,
        programs: programsResult.data.get(row.id) ?? [],
      };
    });

    return ok(rows as unknown as TeamSummary[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getTeamById(id: string): Promise<Result<TeamDetail>> {
  try {
    const supabase = await createClient();

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();
    if (teamError) return err(teamError.message);

    const { data: memberRows, error: membersError } = await supabase
      .from("team_members")
      .select("created_at, profiles(*)")
      .eq("team_id", id);
    if (membersError) return err(membersError.message);

    const members = (
      (memberRows ?? []) as unknown as {
        created_at: string;
        profiles: ProfileRow | null;
      }[]
    )
      .filter((row) => row.profiles !== null)
      .map(
        (row) =>
          ({ ...row.profiles!, joined_at: row.created_at }) as TeamMember,
      );

    const programsResult = await fetchAssignedPrograms([id]);
    if (!programsResult.ok) return err(programsResult.error);

    return ok({
      ...team,
      members,
      programs: programsResult.data.get(id) ?? [],
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createTeam(
  input: CreateTeamInput,
): Promise<Result<TeamRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: input.name,
        description: input.description ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput,
): Promise<Result<TeamRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.avatar_url !== undefined && {
          avatar_url: input.avatar_url,
        }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteTeam(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addTeamMember(
  teamId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, profile_id: profileId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removeTeamMember(
  teamId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", profileId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function assignProgramToTeam(
  teamId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("program_teams")
      .insert({ team_id: teamId, program_id: programId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function unassignProgramFromTeam(
  teamId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("program_teams")
      .delete()
      .eq("team_id", teamId)
      .eq("program_id", programId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
