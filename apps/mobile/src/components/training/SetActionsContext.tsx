import { createContext, useContext } from "react";

/** A (blockExerciseId, setIndex) pair a "tick all" acts on. Declared here
 * (and re-exported by ExerciseSetsCard) so the two modules don't import
 * each other. */
export type GroupSetTarget = { blockExerciseId: string; setIndex: number };

/** The session player's set-level actions, keyed by ids rather than bound
 * per row. Provided once at the top of the player with a stable identity,
 * so set rows / field boxes can be `memo`ised on their data alone — threading
 * per-row closures down as props gave every row a new callback on every
 * render, which defeated memoisation and made a single tick re-render the
 * entire session. */
export type SetActions = {
  setFieldValue: (
    blockExerciseId: string,
    setIndex: number,
    position: number,
    value: number,
  ) => void;
  applyValueForward: (
    blockExerciseId: string,
    position: number,
    value: number,
    targetSetIndices: number[],
  ) => void;
  markSetDone: (blockExerciseId: string, setIndex: number) => void;
  setManyDone: (targets: GroupSetTarget[], done: boolean) => void;
};

const noop = () => {};

const SetActionsContext = createContext<SetActions>({
  setFieldValue: noop,
  applyValueForward: noop,
  markSetDone: noop,
  setManyDone: noop,
});

export const SetActionsProvider = SetActionsContext.Provider;

export const useSetActions = () => useContext(SetActionsContext);
