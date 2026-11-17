import type { BlockExerciseWithDetails, PlacedSequence } from "@hooper/db";
import { resolveStepPick, sequenceVaries } from "@hooper/shared";

/** The exercise name each step resolves to on `setIndex`, falling back to
 * the step's label while it's still empty. */
export function sequenceChainNames(
  sequence: Pick<PlacedSequence, "steps">,
  setIndex = 0,
): string[] {
  return sequence.steps.map((step) => {
    const { exerciseId, from } = resolveStepPick(
      { picks: mapPickIds(step.picks) },
      setIndex,
    );
    return exerciseId ? step.picks[from]!.name : step.label || "—";
  });
}

export function sequenceVariesBySet(
  sequence: Pick<PlacedSequence, "steps">,
): boolean {
  return sequenceVaries(sequence.steps);
}

function mapPickIds(
  picks: Record<number, { id: string }>,
): Record<number, string> {
  return Object.fromEntries(
    Object.entries(picks).map(([setIndex, exercise]) => [
      setIndex,
      exercise.id,
    ]),
  );
}

/** A placement's display name: the sequence name, or the exercise name. */
export function placementName(blockExercise: BlockExerciseWithDetails): string {
  return (
    blockExercise.sequence?.name ??
    blockExercise.exercise?.name ??
    "Untitled sequence"
  );
}

/** A placement that's a plain exercise, not a sequence. */
export type ExercisePlacement = BlockExerciseWithDetails & {
  exercise: NonNullable<BlockExerciseWithDetails["exercise"]>;
  exercise_id: string;
};

export type SequencePlacement = BlockExerciseWithDetails & {
  sequence: PlacedSequence;
};

export function isExercisePlacement(
  blockExercise: BlockExerciseWithDetails,
): blockExercise is ExercisePlacement {
  return blockExercise.exercise !== null && blockExercise.exercise_id !== null;
}

export function isSequencePlacement(
  blockExercise: BlockExerciseWithDetails,
): blockExercise is SequencePlacement {
  return blockExercise.sequence !== null;
}
