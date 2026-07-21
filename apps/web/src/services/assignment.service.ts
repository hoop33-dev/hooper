import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  AssignmentWithProgram,
  ProgramAssignmentRow,
  ProgramStatus,
} from "@hooper/db";

type RawAssignment = ProgramAssignmentRow & {
  programs: { name: string; status: ProgramStatus } | null;
};

function shapeAssignment(row: RawAssignment): AssignmentWithProgram {
  const { programs, ...assignment } = row;
  return {
    ...assignment,
    programName: programs?.name ?? "Unknown program",
    programStatus: programs?.status ?? "draft",
  };
}

export type AssignToTeamInput = {
  programId: string;
  teamId: string;
  assignedBy: string;
  startDate: string;
};

export type AssignToPlayerInput = {
  programId: string;
  playerId: string;
  assignedBy: string;
  startDate: string;
};

export async function assignProgramToTeam(
  input: AssignToTeamInput,
): Promise<Result<ProgramAssignmentRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("program_assignments")
      .insert({
        program_id: input.programId,
        team_id: input.teamId,
        assigned_by: input.assignedBy,
        start_date: input.startDate,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function assignProgramToPlayer(
  input: AssignToPlayerInput,
): Promise<Result<ProgramAssignmentRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("program_assignments")
      .insert({
        program_id: input.programId,
        player_id: input.playerId,
        assigned_by: input.assignedBy,
        start_date: input.startDate,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function listAssignmentsForProgram(
  programId: string,
): Promise<Result<ProgramAssignmentRow[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("program_assignments")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: false });

    if (error) return err(error.message);
    return ok(data ?? []);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function listAssignmentsForTeam(
  teamId: string,
): Promise<Result<AssignmentWithProgram[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("program_assignments")
      .select("*, programs(name, status)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) return err(error.message);
    const rows = (data ?? []) as unknown as RawAssignment[];
    return ok(rows.map(shapeAssignment));
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Everything a given athlete has been assigned — directly, or via any team
 * they're a member of — merged and sorted newest-first. */
export async function listAssignmentsForPlayer(
  playerId: string,
): Promise<Result<AssignmentWithProgram[]>> {
  try {
    const supabase = await createClient();

    const { data: memberships, error: membershipsError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("player_id", playerId);
    if (membershipsError) return err(membershipsError.message);
    const teamIds = (memberships ?? []).map((m) => m.team_id);

    const { data: direct, error: directError } = await supabase
      .from("program_assignments")
      .select("*, programs(name, status)")
      .eq("player_id", playerId);
    if (directError) return err(directError.message);

    const { data: viaTeams, error: teamsError } = teamIds.length
      ? await supabase
          .from("program_assignments")
          .select("*, programs(name, status)")
          .in("team_id", teamIds)
      : { data: [] as RawAssignment[], error: null };
    if (teamsError) return err(teamsError.message);

    const rows = [
      ...((direct ?? []) as unknown as RawAssignment[]),
      ...((viaTeams ?? []) as unknown as RawAssignment[]),
    ];
    const shaped = rows
      .map(shapeAssignment)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return ok(shaped);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function revokeAssignment(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("program_assignments")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
