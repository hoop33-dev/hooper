import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { AthleteMatch, AthleteSummary } from "@hooper/db";

/** Exact-username lookup via the lookup_athlete_by_username RPC — the only
 * way a coach can find an athlete to add to a team or assign a program to
 * directly, since profiles RLS only allows reading your own row otherwise.
 * Returns null (not an error) when no player has that username. */
export async function lookupAthleteByUsername(
  username: string,
): Promise<Result<AthleteMatch | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("lookup_athlete_by_username", {
      p_username: username,
    });
    if (error) return err(error.message);
    return ok(data?.[0] ?? null);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

type Membership = { team_id: string; player_id: string };
type Assignment = { team_id: string | null; player_id: string | null };

/** player_id -> set of (this coach's) team ids they belong to. */
function groupTeamsByPlayer(
  memberships: Membership[],
): Map<string, Set<string>> {
  const teamsByPlayer = new Map<string, Set<string>>();
  for (const m of memberships) {
    if (!teamsByPlayer.has(m.player_id))
      teamsByPlayer.set(m.player_id, new Set());
    teamsByPlayer.get(m.player_id)!.add(m.team_id);
  }
  return teamsByPlayer;
}

/** Splits assignment counts into direct-to-player and per-team buckets, so
 * a player's total can later be direct + sum of their teams' counts. */
function countAssignments(assignments: Assignment[]): {
  byPlayer: Map<string, number>;
  byTeam: Map<string, number>;
} {
  const byPlayer = new Map<string, number>();
  const byTeam = new Map<string, number>();
  for (const a of assignments) {
    if (a.player_id) {
      byPlayer.set(a.player_id, (byPlayer.get(a.player_id) ?? 0) + 1);
    } else if (a.team_id) {
      byTeam.set(a.team_id, (byTeam.get(a.team_id) ?? 0) + 1);
    }
  }
  return { byPlayer, byTeam };
}

/** Every athlete this coach has a relationship with — on one of their
 * teams, individually assigned a program, or both. Requires the
 * profiles_select_team_members and profiles_select_assigned_players RLS
 * policies, since profiles is otherwise locked to your own row. */
export async function listAthletesForCoach(
  coachId: string,
): Promise<Result<AthleteSummary[]>> {
  try {
    const supabase = await createClient();

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("created_by", coachId);
    if (teamsError) return err(teamsError.message);
    const teamIds = (teams ?? []).map((t) => t.id);
    const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

    const { data: memberships, error: membersError } = teamIds.length
      ? await supabase
          .from("team_members")
          .select("team_id, player_id")
          .in("team_id", teamIds)
      : { data: [] as Membership[], error: null };
    if (membersError) return err(membersError.message);

    const { data: assignments, error: assignmentsError } = await supabase
      .from("program_assignments")
      .select("team_id, player_id")
      .eq("assigned_by", coachId);
    if (assignmentsError) return err(assignmentsError.message);

    const teamsByPlayer = groupTeamsByPlayer(memberships ?? []);
    const { byPlayer: directCounts, byTeam: teamCounts } = countAssignments(
      assignments ?? [],
    );

    const playerIds = new Set<string>([
      ...teamsByPlayer.keys(),
      ...directCounts.keys(),
    ]);
    if (playerIds.size === 0) return ok([]);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username, avatar_url")
      .in("id", [...playerIds]);
    if (profilesError) return err(profilesError.message);

    const summaries: AthleteSummary[] = (profiles ?? []).map((p) => {
      const memberTeamIds = [...(teamsByPlayer.get(p.id) ?? [])];
      const teamAssignedCount = memberTeamIds.reduce(
        (sum, id) => sum + (teamCounts.get(id) ?? 0),
        0,
      );
      return {
        id: p.id,
        first_name: p.first_name ?? "",
        last_name: p.last_name ?? "",
        username: p.username ?? "",
        avatar_url: p.avatar_url,
        teamNames: memberTeamIds.map((id) => teamNameById.get(id) ?? ""),
        assignedProgramCount: (directCounts.get(p.id) ?? 0) + teamAssignedCount,
      };
    });

    summaries.sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`,
      ),
    );

    return ok(summaries);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
