import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { ExerciseStyleRow } from "@hooper/db";
import { cache } from "react";

/**
 * Raw style rows, deduped per render. Exercise styles are global reference data
 * (`exercise_styles_select_all` RLS), and the program / session / exercise
 * pages each read them from several code paths — `cache()` collapses that to one
 * query per request.
 */
export const getExerciseStylesRaw = cache(
  async (): Promise<ExerciseStyleRow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exercise_styles")
      .select("*")
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export type CreateStyleInput = {
  name: string;
  description?: string;
  created_by: string;
};

export type UpdateStyleInput = {
  name?: string;
  description?: string;
};

export async function listStyles(): Promise<Result<ExerciseStyleRow[]>> {
  try {
    return ok(await getExerciseStylesRaw());
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createStyle(
  input: CreateStyleInput,
): Promise<Result<ExerciseStyleRow>> {
  try {
    const supabase = await createClient();

    const { data: siblings } = await supabase
      .from("exercise_styles")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      siblings && siblings.length > 0 ? siblings[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("exercise_styles")
      .insert({
        name: input.name,
        description: input.description ?? null,
        position: nextPosition,
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

export async function updateStyle(
  id: string,
  input: UpdateStyleInput,
): Promise<Result<ExerciseStyleRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exercise_styles")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
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

export async function deleteStyle(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("exercise_styles")
      .delete()
      .eq("id", id);

    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
