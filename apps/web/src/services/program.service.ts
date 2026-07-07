import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  ExerciseCategoryRow,
  ProgramRow,
  ProgramSummary,
  ProgramWithSessions,
  SessionRow,
} from "@hooper/db";
import {
  SESSION_SELECT,
  shapeBlocksWithExercises,
  type RawBlock,
} from "./programShaping";

export type CreateProgramInput = {
  name: string;
  description?: string;
  weeks: number;
  sessions_per_week: number;
  created_by: string;
};

export type UpdateProgramInput = {
  name?: string;
  description?: string;
  weeks?: number;
  sessions_per_week?: number;
};

type RawSession = SessionRow & { blocks: RawBlock[] };
type RawProgram = ProgramRow & { sessions: RawSession[] };

export async function listPrograms(): Promise<Result<ProgramSummary[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .select("*, sessions(count)")
      .order("updated_at", { ascending: false });

    if (error) return err(error.message);

    const rows = (data ?? []).map((row) => ({
      ...row,
      sessionCount: Array.isArray(row.sessions)
        ? ((row.sessions[0] as { count: number } | undefined)?.count ?? 0)
        : 0,
    }));

    return ok(rows as ProgramSummary[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function getProgramById(
  id: string,
): Promise<Result<ProgramWithSessions>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .select(`*, sessions(${SESSION_SELECT})`)
      .eq("id", id)
      .single();

    if (error) return err(error.message);

    const { data: cats } = await supabase
      .from("exercise_categories")
      .select("*");
    const allCategories = (cats ?? []) as ExerciseCategoryRow[];

    const raw = data as unknown as RawProgram;
    const sessions = [...raw.sessions]
      .sort((a, b) => a.week_number - b.week_number || a.position - b.position)
      .map(({ blocks, ...session }) => ({
        ...session,
        blocks: shapeBlocksWithExercises(blocks, allCategories),
      }));

    return ok({ ...raw, sessions });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createProgram(
  input: CreateProgramInput,
): Promise<Result<ProgramRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .insert({
        name: input.name,
        description: input.description ?? null,
        weeks: input.weeks,
        sessions_per_week: input.sessions_per_week,
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

export async function updateProgram(
  id: string,
  input: UpdateProgramInput,
): Promise<Result<ProgramRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.weeks !== undefined && { weeks: input.weeks }),
        ...(input.sessions_per_week !== undefined && {
          sessions_per_week: input.sessions_per_week,
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

/** Weeks aren't a stored entity — just a count on the program plus a
 * `week_number` on each session. Deleting one means dropping its sessions
 * (blocks/exercises cascade), shifting every later week's sessions down by
 * one, and decrementing the count to match. */
export async function deleteProgramWeek(
  programId: string,
  weekNumber: number,
): Promise<Result<ProgramRow>> {
  try {
    const supabase = await createClient();

    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("weeks")
      .eq("id", programId)
      .single();
    if (programError) return err(programError.message);
    if (program.weeks <= 1) {
      return err("A program must have at least one week.");
    }

    const { error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .eq("program_id", programId)
      .eq("week_number", weekNumber);
    if (deleteError) return err(deleteError.message);

    const { data: laterSessions, error: laterError } = await supabase
      .from("sessions")
      .select("id, week_number")
      .eq("program_id", programId)
      .gt("week_number", weekNumber);
    if (laterError) return err(laterError.message);

    for (const session of laterSessions ?? []) {
      const { error: shiftError } = await supabase
        .from("sessions")
        .update({ week_number: session.week_number - 1 })
        .eq("id", session.id);
      if (shiftError) return err(shiftError.message);
    }

    const { data, error } = await supabase
      .from("programs")
      .update({ weeks: program.weeks - 1 })
      .eq("id", programId)
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function publishProgram(id: string): Promise<Result<ProgramRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .update({ status: "active" })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteProgram(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("programs").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
