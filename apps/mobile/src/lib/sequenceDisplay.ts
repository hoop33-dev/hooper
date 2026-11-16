import type {
  AthleteBlockExercise,
  AthleteExercise,
  AthleteSequence,
  AthleteSequenceStep,
} from "@hooper/api";
import { resolveStepPick } from "@hooper/shared";

/** One step of a sequence as it plays on a given set. */
export type SequenceSetStep = {
  step: AthleteSequenceStep;
  /** Null while the coach left the step empty. */
  exercise: AthleteExercise | null;
  /** True when this set swaps the step to a different exercise than the
   * set before it. Never true on the first set. */
  changed: boolean;
  /** What the step was on the set before, when `changed`. */
  previous: AthleteExercise | null;
};

const UNAVAILABLE = "unavailable";

function resolveExercise(
  step: AthleteSequenceStep,
  setIndex: number,
): { exercise: AthleteExercise | null; inherited: boolean } {
  // An unavailable pick (null) still counts as a pick, so it stops the
  // carry-forward and its set shows the step as empty.
  const pickIds = Object.fromEntries(
    Object.entries(step.picks).map(([i, exercise]) => [
      i,
      exercise?.id ?? UNAVAILABLE,
    ]),
  );
  const { from, inherited } = resolveStepPick({ picks: pickIds }, setIndex);
  return { exercise: from < 0 ? null : (step.picks[from] ?? null), inherited };
}

/** Every step of `sequence` on `setIndex`, in order. */
export function sequenceSetSteps(
  sequence: AthleteSequence,
  setIndex: number,
): SequenceSetStep[] {
  return sequence.steps.map((step) => {
    const { exercise, inherited } = resolveExercise(step, setIndex);
    const previous =
      setIndex > 0 ? resolveExercise(step, setIndex - 1).exercise : null;
    const changed =
      setIndex > 0 &&
      !inherited &&
      exercise !== null &&
      exercise.id !== previous?.id;
    return { step, exercise, changed, previous: changed ? previous : null };
  });
}

export function sequenceChangeCount(
  sequence: AthleteSequence,
  setIndex: number,
): number {
  return sequenceSetSteps(sequence, setIndex).filter((s) => s.changed).length;
}

/** "Crossover → Skip pass → Euro step", falling back to a step's label
 * while it's empty. */
export function sequenceChainLabel(
  sequence: AthleteSequence,
  setIndex: number,
): string {
  return sequenceSetSteps(sequence, setIndex)
    .map((s) => s.exercise?.name ?? (s.step.label || "—"))
    .join(" → ");
}

export type SequenceBlockExercise = AthleteBlockExercise & {
  sequence: AthleteSequence;
};

/** Whether a placement is a sequence (it carries `sequence`). */
export function isSequenceBlockExercise(
  be: AthleteBlockExercise,
): be is SequenceBlockExercise {
  return be.sequence != null;
}

/** "1 change" / "3 changes". */
export function changesLabel(n: number): string {
  return `${n} change${n === 1 ? "" : "s"}`;
}
