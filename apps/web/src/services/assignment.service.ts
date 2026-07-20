import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { ProgramAssignmentRow } from "@hooper/db";

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
