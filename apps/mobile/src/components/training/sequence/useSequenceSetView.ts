import { useEffect, useRef, useState } from "react";

import type { SetRowState } from "../ExerciseSetsCard";

/** How long a just-logged set stays on screen before the card swaps to the
 * next — enough for the fields' green flash to read before the switch. */
const ADVANCE_DELAY = 400;

/**
 * Which set a sequence card shows. It follows the first unlogged set, but
 * when logging moves that forward it waits ADVANCE_DELAY first; un-logging
 * (undo / tick-all off) follows at once. The athlete can still page to any
 * set. `collapsed` turns on (after the same wait) once every set is logged;
 * `open(i)` reopens a collapsed card on set i so a logged value can be fixed.
 */
export function useSequenceSetView(sets: SetRowState[]) {
  const current = sets.findIndex((s) => !s.done);
  // null while there are no sets yet, so sets that arrive already all logged
  // (-1) still read as a change from the empty first render.
  const position = sets.length ? current : null;
  const [view, setViewState] = useState(Math.max(0, current));
  const [collapsed, setCollapsed] = useState(sets.length > 0 && current < 0);
  const viewRef = useRef(view);
  const prevPosition = useRef(position);

  function show(index: number) {
    viewRef.current = index;
    setViewState(index);
  }

  useEffect(() => {
    const prev = prevPosition.current;
    prevPosition.current = position;
    if (position === prev || position === null) return;
    const current = position;
    const advanced =
      prev !== null && prev >= 0 && (current < 0 || current > prev);
    const timer = setTimeout(
      () => {
        if (current < 0) {
          setCollapsed(true);
          return;
        }
        setCollapsed(false);
        if (current !== viewRef.current) show(current);
      },
      advanced ? ADVANCE_DELAY : 0,
    );
    return () => clearTimeout(timer);
  }, [position]);

  function open(index: number) {
    setCollapsed(false);
    show(index);
  }

  return {
    view: Math.min(view, Math.max(0, sets.length - 1)),
    setView: show,
    collapsed,
    open,
  };
}
