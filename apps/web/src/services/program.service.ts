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
  notes?: string;
  weeks: number;
  created_by: string;
};

export type UpdateProgramInput = {
  name?: string;
  description?: string;
  notes?: string;
  weeks?: number;
};

type RawSession = SessionRow & { blocks: RawBlock[] };
type RawProgram = ProgramRow & { sessions: RawSession[] };

/** "First L." — short enough to sit at the end of the week-tabs row without
 * crowding it. */
function formatProfileName(
  profile: { first_name: string | null; last_name: string | null } | null,
): string | null {
  if (!profile) return null;
  const first = profile.first_name?.trim() ?? "";
  const lastInitial = profile.last_name?.trim()?.[0];
  const name = lastInitial ? `${first} ${lastInitial}.` : first;
  return name.trim() || null;
}

/** [min, max] sessions-per-week across weeks that have at least one session,
 * or null if none do. Derived from real rows rather than a stored target. */
function sessionsPerWeekRange(
  sessions: { week_number: number }[],
): [number, number] | null {
  if (sessions.length === 0) return null;
  const counts = new Map<number, number>();
  for (const { week_number } of sessions) {
    counts.set(week_number, (counts.get(week_number) ?? 0) + 1);
  }
  const values = [...counts.values()];
  return [Math.min(...values), Math.max(...values)];
}

export async function listPrograms(): Promise<Result<ProgramSummary[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("programs")
      .select("*, sessions(week_number)")
      .order("updated_at", { ascending: false });

    if (error) return err(error.message);

    const rows = (data ?? []).map((row) => {
      const sessions = Array.isArray(row.sessions)
        ? (row.sessions as { week_number: number }[])
        : [];
      return {
        ...row,
        sessionCount: sessions.length,
        sessionsPerWeek: sessionsPerWeekRange(sessions),
      };
    });

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

    const { data: creator } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", raw.created_by)
      .single();

    const sessions = [...raw.sessions]
      .sort((a, b) => a.week_number - b.week_number || a.position - b.position)
      .map(({ blocks, ...session }) => ({
        ...session,
        blocks: shapeBlocksWithExercises(blocks, allCategories),
      }));

    return ok({
      ...raw,
      sessions,
      updatedByName: formatProfileName(creator),
    });
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
        notes: input.notes ?? null,
        weeks: input.weeks,
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
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.weeks !== undefined && { weeks: input.weeks }),
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

/** Generalizes "+ Week" from a fixed +1 into +N — still just bumps the
 * count, no sessions created (weeks aren't a stored entity, see
 * deleteProgramWeek's comment above). */
export async function addBlankProgramWeeks(
  programId: string,
  count: number,
): Promise<Result<ProgramRow>> {
  try {
    if (count < 1) return err("Enter at least 1 week.");
    const supabase = await createClient();
    const { data: program, error } = await supabase
      .from("programs")
      .select("weeks")
      .eq("id", programId)
      .single();
    if (error) return err(error.message);
    return updateProgram(programId, { weeks: program.weeks + count });
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
