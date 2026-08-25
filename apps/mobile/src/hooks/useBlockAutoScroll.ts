import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ScrollView,
} from "react-native";

export type AutoScrollItem = { id: string; done: boolean };

/**
 * Keeps a block's ScrollView pointed at the "right" card without the athlete
 * scrolling manually: jumps to the first not-yet-completed item whenever
 * `blockKey` changes (Next block / Prev / a tab tap — the top of the list if
 * nothing in it has been started yet), and nudges the next item into view
 * once the current one is ticked done. `items` is caller-supplied so both a
 * plain block (one item per exercise) and a superset block (one item per
 * round) can share this hook.
 */
export function useBlockAutoScroll(blockKey: string, items: AutoScrollItem[]) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cardLayouts = useRef(new Map<string, LayoutRectangle>());
  const prevDoneIds = useRef(new Set<string>());
  // Target for a card that isn't measured yet (e.g. its block just mounted)
  // — registerCardLayout resolves this once that measurement comes in.
  const pendingScroll = useRef<{ id: string; animated: boolean } | null>(null);
  // Read by the block-switch effect without being a dependency of it — that
  // effect should fire only on block identity, not every completion update.
  const latestItems = useRef(items);
  latestItems.current = items;

  const scrollItemIntoView = useCallback(
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
        scrollItemIntoView(id, animated);
      }
    },
    [scrollItemIntoView],
  );

  // Block switch: jump to the first not-yet-completed item. Also resets
  // prevDoneIds so the completion-tracking effect below doesn't mistake
  // "entering a block with some items already done" for "just finished one".
  useEffect(() => {
    const current = latestItems.current;
    const target = items.find((it) => !it.done) ?? items[0];
    prevDoneIds.current = new Set(
      current.filter((it) => it.done).map((it) => it.id),
    );
    if (target) scrollItemIntoView(target.id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockKey, scrollItemIntoView]);

  useEffect(() => {
    const doneNow = new Set(items.filter((it) => it.done).map((it) => it.id));
    const justCompletedIdx = items.findIndex(
      (it) => doneNow.has(it.id) && !prevDoneIds.current.has(it.id),
    );
    prevDoneIds.current = doneNow;

    if (justCompletedIdx === -1) return;
    const next = items[justCompletedIdx + 1];
    if (next) scrollItemIntoView(next.id, true);
  }, [items, scrollItemIntoView]);

  function onViewportLayout(e: LayoutChangeEvent) {
    setViewportHeight(e.nativeEvent.layout.height);
  }

  return { scrollRef, onViewportLayout, registerCardLayout };
}
