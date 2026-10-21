import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { fetchLastSignIns } from "@/src/services/athlete.service";
import type {
  AssignedProgramRef,
  AthleteTeam,
  ProfileRow,
  TeamDashboardRow,
  TeamDetail,
  TeamMember,
  TeamMembershipRow,
  TeamMembershipVia,
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

type MembershipRef = Pick<
  TeamMembershipRow,
  | "team_id"
  | "profile_id"
  | "joined_at"
  | "source"
  | "package_id"
  | "package_name"
>;

const MEMBERSHIP_COLUMNS =
  "team_id, profile_id, joined_at, source, package_id, package_name";

/** team_id -> distinct athlete count. Reads team_memberships, so package
 * buyers count, and an athlete on a team by hand and via a package (or
 * via two packages) counts once. */
async function fetchMemberCounts(
  teamIds: string[],
): Promise<Result<Map<string, number>>> {
  if (teamIds.length === 0) return ok(new Map());

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, profile_id")
    .in("team_id", teamIds);
  if (error) return err(error.message);

  const byTeam = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = byTeam.get(row.team_id) ?? new Set<string>();
    set.add(row.profile_id);
    byTeam.set(row.team_id, set);
  }
  return ok(new Map([...byTeam].map(([id, set]) => [id, set.size])));
}

/** Folds one athlete's team_memberships rows (for one team) into how they're
 * on it, plus the earliest join. */
function foldMembership(rows: MembershipRef[]): {
  via: TeamMembershipVia;
  joined_at: string;
} {
  const via: TeamMembershipVia = { manual: false, packages: [] };
  let joined_at = rows[0].joined_at;
  for (const row of rows) {
    if (row.joined_at < joined_at) joined_at = row.joined_at;
    if (row.source === "manual") via.manual = true;
    else if (
      row.package_id &&
      !via.packages.some((p) => p.id === row.package_id)
    ) {
      via.packages.push({ id: row.package_id, name: row.package_name ?? "" });
    }
  }
  via.packages.sort((a, b) => a.name.localeCompare(b.name));
  return { via, joined_at };
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const list = out.get(key(row)) ?? [];
    list.push(row);
    out.set(key(row), list);
  }
  return out;
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
      .select("*")
      .order("name");
    if (error) return err(error.message);

    const teamIds = (data ?? []).map((row) => row.id);
    const [programsResult, countsResult] = await Promise.all([
      fetchAssignedPrograms(teamIds),
      fetchMemberCounts(teamIds),
    ]);
    if (!programsResult.ok) return err(programsResult.error);
    if (!countsResult.ok) return err(countsResult.error);

    const rows: TeamSummary[] = (data ?? []).map((row) => ({
      ...row,
      memberCount: countsResult.data.get(row.id) ?? 0,
      programs: programsResult.data.get(row.id) ?? [],
    }));

    return ok(rows);
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

      const [teamsResult, programsResult, countsResult] = await Promise.all([
        supabase.from("teams").select("*").in("id", orderedIds),
        fetchAssignedPrograms(orderedIds),
        fetchMemberCounts(orderedIds),
      ]);
      if (teamsResult.error) return err(teamsResult.error.message);
      if (!programsResult.ok) return err(programsResult.error);
      if (!countsResult.ok) return err(countsResult.error);

      const byId = new Map(teamsResult.data.map((row) => [row.id, row]));
      const rows = orderedIds
        .map((id) => byId.get(id))
        .filter((row): row is NonNullable<typeof row> => row !== undefined)
        .map((row) => ({
          ...row,
          memberCount: countsResult.data.get(row.id) ?? 0,
          programs: programsResult.data.get(row.id) ?? [],
        }));

      return ok(rows as unknown as TeamDashboardRow[]);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

/** The teams an athlete is on, in the same shape as `listTeams` plus how
 * they're on each (by hand and/or via a package) — for the athlete detail
 * page's Teams card and its team-assigned programs. */
export async function listTeamsForAthlete(
  profileId: string,
): Promise<Result<AthleteTeam[]>> {
  try {
    const supabase = await createClient();
    const { data: memberRows, error: memberError } = await supabase
      .from("team_memberships")
      .select(MEMBERSHIP_COLUMNS)
      .eq("profile_id", profileId);
    if (memberError) return err(memberError.message);

    const byTeam = groupBy(memberRows ?? [], (row) => row.team_id);
    const teamIds = [...byTeam.keys()];
    if (teamIds.length === 0) return ok([]);

    const [teamsResult, programsResult, countsResult] = await Promise.all([
      supabase.from("teams").select("*").in("id", teamIds).order("name"),
      fetchAssignedPrograms(teamIds),
      fetchMemberCounts(teamIds),
    ]);
    if (teamsResult.error) return err(teamsResult.error.message);
    if (!programsResult.ok) return err(programsResult.error);
    if (!countsResult.ok) return err(countsResult.error);

    const rows: AthleteTeam[] = teamsResult.data.map((row) => ({
      ...row,
      memberCount: countsResult.data.get(row.id) ?? 0,
      programs: programsResult.data.get(row.id) ?? [],
      via: foldMembership(byTeam.get(row.id) ?? []).via,
    }));
    return ok(rows);
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
      .from("team_memberships")
      .select(MEMBERSHIP_COLUMNS)
      .eq("team_id", id);
    if (membersError) return err(membersError.message);

    const byProfile = groupBy(memberRows ?? [], (row) => row.profile_id);
    let profiles: ProfileRow[] = [];
    if (byProfile.size > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", [...byProfile.keys()]);
      if (error) return err(error.message);
      profiles = data ?? [];
    }

    const members: TeamMember[] = profiles
      .map((profile) => ({
        ...profile,
        ...foldMembership(byProfile.get(profile.id)!),
        last_sign_in_at: null,
      }))
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at));

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
