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
import { toStepsPayload, type SequenceStepInput } from "./sequenceSteps";

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

/** Writes details, measurements and steps in one transaction. */
async function saveSequence(
  supabase: SupabaseClient,
  sequenceId: string,
  input: SequenceInput,
): Promise<Result<LibrarySequenceRow>> {
  const { data, error } = await supabase.rpc("save_sequence", {
    p_sequence_id: sequenceId,
    p_name: input.name,
    p_description: input.description,
    p_sets: input.measurements.length,
    p_measurements: toMeasurementRows(sequenceId, input.measurements).map(
      ({ block_exercise_id: _, ...m }) => m,
    ),
    p_steps: toStepsPayload(input.steps, input.measurements.length),
  });
  return error ? err(error.message) : ok(data);
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
    const saved = await saveSequence(supabase, data.id, input);
    if (!saved.ok) {
      // Don't leave a half-written sequence behind.
      await supabase.from("sequences").delete().eq("id", data.id);
      return err(saved.error);
    }
    return saved;
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
    return await saveSequence(supabase, id, input);
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
