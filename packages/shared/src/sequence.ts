// Pure helpers for sequences: one trackable item made of ordered steps,
// each filled with an exercise that can change from set to set.
//
// Picks are sparse and keyed by set index. Set 0 defines each step; a later
// set carries the most recent earlier pick forward until it has its own
// entry. Every updater here is immutable and keeps picks normalized, so a
// pick that matches what the set would inherit anyway is never stored.

export type SequenceStepDraft = {
  id: string;
  label: string;
  category_id: string | null;
  /** exercise id per set index, sparse. */
  picks: Record<number, string>;
};

type AnyDraft = SequenceDraft<unknown>;
type SetOf<D extends AnyDraft> = D["sets"][number];

/** `S` is whatever one set's values look like to the caller (the portal
 * uses its measurement slots). Its index in `sets` is the set index. */
export type SequenceDraft<S> = {
  steps: SequenceStepDraft[];
  sets: S[];
};

export type ResolvedPick = {
  exerciseId: string | null;
  /** True when the exercise comes from an earlier set, not this one. */
  inherited: boolean;
  /** The set index the exercise was picked on, -1 when the step is empty. */
  from: number;
};

export function resolveStepPick(
  step: Pick<SequenceStepDraft, "picks">,
  setIndex: number,
): ResolvedPick {
  for (let i = setIndex; i >= 0; i--) {
    const exerciseId = step.picks[i];
    if (exerciseId) return { exerciseId, inherited: i !== setIndex, from: i };
  }
  return { exerciseId: null, inherited: false, from: -1 };
}

/** The exercise id each step resolves to on `setIndex`, in step order. */
export function sequenceChainIds(
  steps: Pick<SequenceStepDraft, "picks">[],
  setIndex = 0,
): (string | null)[] {
  return steps.map((step) => resolveStepPick(step, setIndex).exerciseId);
}

/** Whether any set after the first changes a step. */
export function sequenceVaries(
  steps: { picks: Record<number, unknown> }[],
): boolean {
  return steps.some((step) =>
    Object.keys(step.picks).some((key) => Number(key) > 0),
  );
}

/** Drops picks that repeat what the set would inherit, and any at or past
 * `setCount`. */
export function normalizeStepPicks(
  picks: Record<number, string>,
  setCount: number,
): Record<number, string> {
  const result: Record<number, string> = {};
  let current: string | null = null;
  for (let i = 0; i < setCount; i++) {
    const pick = picks[i];
    if (pick && pick !== current) {
      result[i] = pick;
      current = pick;
    }
  }
  return result;
}

function mapStep<D extends AnyDraft>(
  draft: D,
  stepId: string,
  fn: (step: SequenceStepDraft) => SequenceStepDraft,
): D {
  return {
    ...draft,
    steps: draft.steps.map((step) => (step.id === stepId ? fn(step) : step)),
  };
}

function withNormalizedPicks<D extends AnyDraft>(draft: D): D {
  return {
    ...draft,
    steps: draft.steps.map((step) => ({
      ...step,
      picks: normalizeStepPicks(step.picks, draft.sets.length),
    })),
  };
}

/** Fills a step on one set. Later sets that inherit from it change too. */
export function pickStepExercise<D extends AnyDraft>(
  draft: D,
  setIndex: number,
  stepId: string,
  exerciseId: string,
): D {
  return withNormalizedPicks(
    mapStep(draft, stepId, (step) => ({
      ...step,
      picks: { ...step.picks, [setIndex]: exerciseId },
    })),
  );
}

/** Resets a set's pick so it carries the earlier set forward again. */
export function clearStepPick<D extends AnyDraft>(
  draft: D,
  setIndex: number,
  stepId: string,
): D {
  return withNormalizedPicks(
    mapStep(draft, stepId, (step) => {
      const picks = { ...step.picks };
      delete picks[setIndex];
      return { ...step, picks };
    }),
  );
}

/** Appends a set that carries every step forward. */
export function addSequenceSet<D extends AnyDraft>(
  draft: D,
  makeSet: (last: SetOf<D> | undefined) => SetOf<D>,
): D {
  return { ...draft, sets: [...draft.sets, makeSet(draft.sets.at(-1))] };
}

/** Appends a copy of `setIndex`, including the exercises it resolves to. */
export function duplicateSequenceSet<D extends AnyDraft>(
  draft: D,
  setIndex: number,
  cloneSet: (set: SetOf<D>) => SetOf<D>,
): D {
  const source = draft.sets[setIndex];
  if (source === undefined) return draft;
  const newIndex = draft.sets.length;
  return withNormalizedPicks({
    ...draft,
    sets: [...draft.sets, cloneSet(source)],
    steps: draft.steps.map((step) => {
      const resolved = resolveStepPick(step, setIndex).exerciseId;
      return resolved
        ? { ...step, picks: { ...step.picks, [newIndex]: resolved } }
        : step;
    }),
  });
}

/** Removes a set (keeping at least one), shifting later picks down. When
 * the removed set defined a step, the next set inherits that definition so
 * it doesn't change what it resolves to. */
export function removeSequenceSet<D extends AnyDraft>(
  draft: D,
  setIndex: number,
): D {
  if (draft.sets.length < 2 || !draft.sets[setIndex]) return draft;
  return withNormalizedPicks({
    ...draft,
    sets: draft.sets.filter((_, i) => i !== setIndex),
    steps: draft.steps.map((step) => {
      const nextResolved = resolveStepPick(step, setIndex + 1).exerciseId;
      const picks: Record<number, string> = {};
      for (const [key, exerciseId] of Object.entries(step.picks)) {
        const i = Number(key);
        if (i < setIndex) picks[i] = exerciseId;
        else if (i > setIndex) picks[i - 1] = exerciseId;
      }
      if (setIndex + 1 < draft.sets.length && nextResolved) {
        picks[setIndex] = nextResolved;
      }
      return { ...step, picks };
    }),
  });
}

/** Trims or pads the set list to `count` (supersets lock sets to rounds).
 * New sets copy the last one and carry every step forward. */
export function resizeSequenceSets<D extends AnyDraft>(
  draft: D,
  count: number,
  cloneSet: (set: SetOf<D> | undefined) => SetOf<D>,
): D {
  const target = Math.max(1, count);
  const sets = draft.sets.slice(0, target);
  while (sets.length < target) sets.push(cloneSet(sets.at(-1)));
  return withNormalizedPicks({ ...draft, sets });
}

export function addSequenceStep<D extends AnyDraft>(
  draft: D,
  id: string,
  label = `Step ${draft.steps.length + 1}`,
): D {
  return {
    ...draft,
    steps: [...draft.steps, { id, label, category_id: null, picks: {} }],
  };
}

export function updateSequenceStep<D extends AnyDraft>(
  draft: D,
  stepId: string,
  patch: Partial<Pick<SequenceStepDraft, "label" | "category_id">>,
): D {
  return mapStep(draft, stepId, (step) => ({ ...step, ...patch }));
}

export function moveSequenceStep<D extends AnyDraft>(
  draft: D,
  stepId: string,
  direction: -1 | 1,
): D {
  const from = draft.steps.findIndex((step) => step.id === stepId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= draft.steps.length) return draft;
  const steps = [...draft.steps];
  [steps[from], steps[to]] = [steps[to], steps[from]];
  return { ...draft, steps };
}

/** Removes a step, keeping at least one. */
export function removeSequenceStep<D extends AnyDraft>(
  draft: D,
  stepId: string,
): D {
  if (draft.steps.length < 2) return draft;
  return { ...draft, steps: draft.steps.filter((step) => step.id !== stepId) };
}
