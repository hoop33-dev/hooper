import type { SetRowState } from "@/src/components/training/ExerciseSetsCard";
import type { AthleteBlock, AthleteBlockExercise } from "@hooper/api";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ScrollView,
} from "react-native";

function isFullyDone(
  be: AthleteBlockExercise,
  setsByBlockExercise: Record<string, SetRowState[]>,
) {
  const sets = setsByBlockExercise[be.id] ?? [];
  return sets.length > 0 && sets.every((s) => s.done);
}

/**
 * Keeps a block's ScrollView pointed at the "right" exercise without the
 * athlete scrolling manually: jumps to the first not-yet-completed exercise
 * whenever the block itself changes (Next block / Prev / a tab tap — the top
 * of the list if nothing in it has been started yet), and nudges the next
 * exercise into view once the current one's last set is ticked.
 */
export function useBlockAutoScroll(
  block: AthleteBlock,
  setsByBlockExercise: Record<string, SetRowState[]>,
) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cardLayouts = useRef(new Map<string, LayoutRectangle>());
  const prevDoneIds = useRef(new Set<string>());
  // Target for a card that isn't measured yet (e.g. its block just mounted)
  // — registerCardLayout resolves this once that measurement comes in.
  const pendingScroll = useRef<{ id: string; animated: boolean } | null>(null);
  // Read by the block-switch effect without being a dependency of it — that
  // effect should fire only on block identity, not every completion update.
  const latestSets = useRef(setsByBlockExercise);
  latestSets.current = setsByBlockExercise;

  const scrollExerciseIntoView = useCallback(
    (id: string, animated: boolean) => {
      const layout = cardLayouts.current.get(id);
      if (!layout || viewportHeight === 0) {
        pendingScroll.current = { id, animated };
        return;
      }
      const targetY = Math.max(
        0,
        layout.y + layout.height / 2 - viewportHeight / 2,
      );
      scrollRef.current?.scrollTo({ y: targetY, animated });
    },
    [viewportHeight],
  );

  const registerCardLayout = useCallback(
    (id: string, layout: LayoutRectangle) => {
      cardLayouts.current.set(id, layout);
      if (pendingScroll.current?.id === id) {
        const { animated } = pendingScroll.current;
        pendingScroll.current = null;
        scrollExerciseIntoView(id, animated);
      }
    },
    [scrollExerciseIntoView],
  );

  // Block switch: jump to the first not-yet-completed exercise. Also resets
  // prevDoneIds so the completion-tracking effect below doesn't mistake
  // "entering a block with some exercises already done" for "just finished
  // an exercise".
  useEffect(() => {
    const sets = latestSets.current;
    const target =
      block.exercises.find((be) => !isFullyDone(be, sets)) ??
      block.exercises[0];
    prevDoneIds.current = new Set(
      block.exercises.filter((be) => isFullyDone(be, sets)).map((be) => be.id),
    );
    if (target) scrollExerciseIntoView(target.id, false);
  }, [block, scrollExerciseIntoView]);

  useEffect(() => {
    const doneNow = new Set(
      block.exercises
        .filter((be) => isFullyDone(be, setsByBlockExercise))
        .map((be) => be.id),
    );
    const justCompleted = block.exercises.find(
      (be) => doneNow.has(be.id) && !prevDoneIds.current.has(be.id),
    );
    prevDoneIds.current = doneNow;

    if (!justCompleted) return;
    const idx = block.exercises.findIndex((be) => be.id === justCompleted.id);
    const next = block.exercises[idx + 1];
    if (next) scrollExerciseIntoView(next.id, true);
  }, [block, setsByBlockExercise, scrollExerciseIntoView]);

  function onViewportLayout(e: LayoutChangeEvent) {
    setViewportHeight(e.nativeEvent.layout.height);
  }

  return { scrollRef, onViewportLayout, registerCardLayout };
}
