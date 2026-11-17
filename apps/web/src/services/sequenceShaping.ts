import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import type {
  ExerciseRow,
  PlacedSequence,
  SequenceStepRow,
  SequenceStepWithPicks,
} from "@hooper/db";
import type { SupabaseClient } from "./block.service";

const STEP_COLUMNS = "id, position, label, category_id";

// Steps embed for each table that holds sequence steps. Aliased to
// `sequence_steps` / `picks` so one raw type and shaper covers them all.
export const PLACED_SEQUENCE_STEPS_SELECT = `sequence_steps:block_exercise_sequence_steps(${STEP_COLUMNS}, picks:block_exercise_sequence_picks(set_index, exercise:exercises(*)))`;
export const TEMPLATE_SEQUENCE_STEPS_SELECT = `sequence_steps:block_template_exercise_sequence_steps(${STEP_COLUMNS}, picks:block_template_exercise_sequence_picks(set_index, exercise:exercises(*)))`;
export const LIBRARY_SEQUENCE_STEPS_SELECT = `sequence_steps(${STEP_COLUMNS}, picks:sequence_step_picks(set_index, exercise:exercises(*)))`;

export type RawSequenceStep = SequenceStepRow & {
  picks: { set_index: number; exercise: ExerciseRow | null }[];
};

export function shapeSequenceSteps(
  raw: RawSequenceStep[] | null | undefined,
): SequenceStepWithPicks[] {
  return [...(raw ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ picks, ...step }) => ({
      ...step,
      picks: Object.fromEntries(
        picks
          .filter((p) => p.exercise)
          .map((p) => [p.set_index, p.exercise as ExerciseRow]),
      ),
    }));
}

/** The placement's sequence, or null when it's a plain exercise. */
export function shapePlacedSequence(
  row: {
    sequence_name: string | null;
    sequence_description: string | null;
    source_sequence_id: string | null;
  },
  steps: RawSequenceStep[] | null | undefined,
): PlacedSequence | null {
  if (row.sequence_name == null) return null;
  return {
    name: row.sequence_name,
    description: row.sequence_description,
    sourceSequenceId: row.source_sequence_id,
    steps: shapeSequenceSteps(steps),
  };
}

/** Reads one placement's steps back as stored, e.g. after a copy that
 * trimmed them to the block's round count. */
export async function readPlacedSequenceSteps(
  supabase: SupabaseClient,
  owner: "placement" | "template",
  id: string,
): Promise<Result<SequenceStepWithPicks[]>> {
  const { data, error } =
    owner === "placement"
      ? await supabase
          .from("block_exercises")
          .select(PLACED_SEQUENCE_STEPS_SELECT)
          .eq("id", id)
          .single()
      : await supabase
          .from("block_template_exercises")
          .select(TEMPLATE_SEQUENCE_STEPS_SELECT)
          .eq("id", id)
          .single();
  if (error) return err(error.message);
  const raw = data as unknown as { sequence_steps: RawSequenceStep[] };
  return ok(shapeSequenceSteps(raw.sequence_steps));
}
