import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  LibrarySequenceMeasurementRow,
  LibrarySequenceRow,
  LibrarySequenceWithDetails,
} from "@hooper/db";
import { cache } from "react";
import {
  toMeasurementRows,
  type MeasurementInput,
  type SupabaseClient,
} from "./block.service";
import {
  LIBRARY_SEQUENCE_STEPS_SELECT,
  shapeSequenceSteps,
  type RawSequenceStep,
} from "./sequenceShaping";
import { replaceSequenceSteps, type SequenceStepInput } from "./sequenceSteps";

/** A full save of a library sequence. The set count is
 * `measurements.length`. */
export type SequenceInput = {
  name: string;
  description: string | null;
  measurements: MeasurementInput;
  steps: SequenceStepInput[];
};

const SEQUENCE_SELECT = `*, sequence_measurements(*), ${LIBRARY_SEQUENCE_STEPS_SELECT}`;

type RawSequence = LibrarySequenceRow & {
  sequence_measurements: LibrarySequenceMeasurementRow[];
  sequence_steps: RawSequenceStep[];
};

function shapeSequence({
  sequence_measurements,
  sequence_steps,
  ...row
}: RawSequence): LibrarySequenceWithDetails {
  return {
    ...row,
    steps: shapeSequenceSteps(sequence_steps),
    measurements: [...(sequence_measurements ?? [])].sort(
      (a, b) => a.position - b.position || a.set_index - b.set_index,
    ),
  };
}

/** Request-scoped dedup: the Sequences page and every program / session
 * canvas page read the list. */
export const listSequences = cache(
  async (): Promise<Result<LibrarySequenceWithDetails[]>> => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("sequences")
        .select(SEQUENCE_SELECT)
        .order("name");
      if (error) return err(error.message);
      return ok((data as unknown as RawSequence[]).map(shapeSequence));
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

export async function getSequence(
  id: string,
): Promise<Result<LibrarySequenceWithDetails>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sequences")
      .select(SEQUENCE_SELECT)
      .eq("id", id)
      .single();
    if (error) return err(error.message);
    return ok(shapeSequence(data as unknown as RawSequence));
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

async function replaceSequenceMeasurements(
  supabase: SupabaseClient,
  sequenceId: string,
  measurements: MeasurementInput,
): Promise<Result<void>> {
  const { error: deleteError } = await supabase
    .from("sequence_measurements")
    .delete()
    .eq("sequence_id", sequenceId);
  if (deleteError) return err(deleteError.message);
  const rows = toMeasurementRows(sequenceId, measurements).map(
    ({ block_exercise_id, ...m }) => ({ ...m, sequence_id: block_exercise_id }),
  );
  if (rows.length === 0) return ok(undefined);
  const { error } = await supabase.from("sequence_measurements").insert(rows);
  return error ? err(error.message) : ok(undefined);
}

async function writeChildren(
  supabase: SupabaseClient,
  sequenceId: string,
  input: SequenceInput,
): Promise<Result<void>> {
  const measurements = await replaceSequenceMeasurements(
    supabase,
    sequenceId,
    input.measurements,
  );
  if (!measurements.ok) return measurements;
  return replaceSequenceSteps(
    supabase,
    "library",
    sequenceId,
    input.steps,
    input.measurements.length,
  );
}

export async function createSequence(
  input: SequenceInput,
  createdBy: string,
): Promise<Result<LibrarySequenceRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sequences")
      .insert({
        name: input.name,
        description: input.description,
        sets: Math.max(1, input.measurements.length),
        created_by: createdBy,
      })
      .select()
      .single();
    if (error) return err(error.message);
    const children = await writeChildren(supabase, data.id, input);
    if (!children.ok) {
      // Don't leave a half-written sequence behind.
      await supabase.from("sequences").delete().eq("id", data.id);
      return err(children.error);
    }
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateSequence(
  id: string,
  input: SequenceInput,
): Promise<Result<LibrarySequenceRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sequences")
      .update({
        name: input.name,
        description: input.description,
        sets: Math.max(1, input.measurements.length),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);
    const children = await writeChildren(supabase, id, input);
    if (!children.ok) return err(children.error);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Renames a sequence without touching its steps or values. */
export async function updateSequenceDetails(
  id: string,
  details: { name: string; description: string | null },
): Promise<Result<LibrarySequenceRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sequences")
      .update(details)
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteSequence(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("sequences").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
