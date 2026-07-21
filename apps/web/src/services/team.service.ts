import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  TeamMemberSummary,
  TeamRow,
  TeamSummary,
  TeamWithMembers,
} from "@hooper/db";

type RawTeamRow = TeamRow & {
  team_members: { player_id: string }[];
  program_assignments: {
    program_id: string;
    programs: { name: string } | null;
  }[];
};

export async function listTeams(): Promise<Result<TeamSummary[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select(
        "*, team_members(player_id), program_assignments(program_id, programs(name))",
      )
      .order("created_at", { ascending: false });

    if (error) return err(error.message);

    const rows = (data ?? []) as unknown as RawTeamRow[];
    const summaries = rows.map(
      ({ team_members, program_assignments, ...team }) => {
        // Dedupe by program: a team's roster could theoretically end up
        // assigned the same program more than once.
        const programsById = new Map(
          program_assignments.map((a) => [
            a.program_id,
            a.programs?.name ?? "Unknown program",
          ]),
        );
        return {
          ...team,
          memberCount: team_members.length,
          assignedPrograms: [...programsById.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        };
      },
    );

    return ok(summaries);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getTeamWithMembers(
  id: string,
): Promise<Result<TeamWithMembers>> {
  try {
    const supabase = await createClient();

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();
    if (teamError) return err(teamError.message);

    const { data: memberships, error: membersError } = await supabase
      .from("team_members")
      .select("player_id, added_at")
      .eq("team_id", id)
      .order("added_at", { ascending: true });
    if (membersError) return err(membersError.message);

    const playerIds = (memberships ?? []).map((m) => m.player_id);

    const { data: profiles, error: profilesError } = playerIds.length
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, username, avatar_url")
          .in("id", playerIds)
      : { data: [] as never[], error: null };
    if (profilesError) return err(profilesError.message);

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p]),
    );

    const members: TeamMemberSummary[] = (memberships ?? []).map((m) => {
      const profile = profileById.get(m.player_id) as
        | {
            first_name: string | null;
            last_name: string | null;
            username: string | null;
            avatar_url: string | null;
          }
        | undefined;
      return {
        player_id: m.player_id,
        added_at: m.added_at,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        username: profile?.username ?? "",
        avatar_url: profile?.avatar_url ?? null,
      };
    });

    return ok({ ...team, members });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createTeam(
  name: string,
  createdBy: string,
): Promise<Result<TeamRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .insert({ name, created_by: createdBy })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function renameTeam(
  id: string,
  name: string,
): Promise<Result<TeamRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .update({ name })
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
  playerId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, player_id: playerId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removeTeamMember(
  teamId: string,
  playerId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
