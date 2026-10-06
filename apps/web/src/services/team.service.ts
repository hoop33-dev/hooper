import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { fetchLastSignIns } from "@/src/services/athlete.service";
import type {
  AssignedProgramRef,
  ProfileRow,
  TeamDashboardRow,
  TeamDetail,
  TeamMember,
  TeamRow,
  TeamSummary,
} from "@hooper/db";
import { cache } from "react";

type ProgramTeamJoinRow = {
  team_id: string;
  programs: AssignedProgramRef | null;
};

async function fetchAssignedPrograms(
  teamIds: string[],
): Promise<Result<Map<string, AssignedProgramRef[]>>> {
  if (teamIds.length === 0) return ok(new Map());

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

/** The dashboard's Teams card: the N teams with the most recently added
 * member (falling back to updated_at for teams with none), ranked via the
 * `team_recency` view rather than name. */
export const listRecentTeams = cache(
  async (limit = 6): Promise<Result<TeamDashboardRow[]>> => {
    try {
      const supabase = await createClient();
      const { data: recency, error: recencyError } = await supabase
        .from("team_recency")
        .select("team_id")
        .order("recency_at", { ascending: false })
        .limit(limit);
      if (recencyError) return err(recencyError.message);

      const orderedIds = (recency ?? []).map((row) => row.team_id);
      if (orderedIds.length === 0) return ok([]);

      const [teamsResult, programsResult] = await Promise.all([
        supabase
          .from("teams")
          .select("*, team_members(count)")
          .in("id", orderedIds),
        fetchAssignedPrograms(orderedIds),
      ]);
      if (teamsResult.error) return err(teamsResult.error.message);
      if (!programsResult.ok) return err(programsResult.error);

      const byId = new Map(teamsResult.data.map((row) => [row.id, row]));
      const rows = orderedIds
        .map((id) => byId.get(id))
        .filter((row): row is NonNullable<typeof row> => row !== undefined)
        .map((row) => {
          const memberCount = Array.isArray(row.team_members)
            ? ((row.team_members[0] as { count: number } | undefined)?.count ??
              0)
            : 0;
          return {
            ...row,
            memberCount,
            programs: programsResult.data.get(row.id) ?? [],
          };
        });

      return ok(rows as unknown as TeamDashboardRow[]);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

/** The teams an athlete is on, in the same shape as `listTeams` — for the
 * athlete detail page's Teams card and its team-assigned programs. */
export async function listTeamsForAthlete(
  profileId: string,
): Promise<Result<TeamSummary[]>> {
  try {
    const supabase = await createClient();
    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", profileId);
    if (memberError) return err(memberError.message);

    const teamIds = (memberRows ?? []).map((row) => row.team_id);
    if (teamIds.length === 0) return ok([]);

    const [teamsResult, programsResult] = await Promise.all([
      supabase
        .from("teams")
        .select("*, team_members(count)")
        .in("id", teamIds)
        .order("name"),
      fetchAssignedPrograms(teamIds),
    ]);
    if (teamsResult.error) return err(teamsResult.error.message);
    if (!programsResult.ok) return err(programsResult.error);

    const rows = teamsResult.data.map((row) => {
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
          ({
            ...row.profiles!,
            joined_at: row.created_at,
            last_sign_in_at: null,
          }) as TeamMember,
      );

    const [programsResult, lastSignInsResult] = await Promise.all([
      fetchAssignedPrograms([id]),
      members.length > 0
        ? fetchLastSignIns(members.map((m) => m.id))
        : Promise.resolve(ok(new Map<string, string | null>())),
    ]);
    if (!programsResult.ok) return err(programsResult.error);
    if (!lastSignInsResult.ok) return err(lastSignInsResult.error);

    return ok({
      ...team,
      members: members.map((m) => ({
        ...m,
        last_sign_in_at: lastSignInsResult.data.get(m.id) ?? null,
      })),
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
