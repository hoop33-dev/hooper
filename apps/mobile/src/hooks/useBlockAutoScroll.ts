import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";

export type AutoScrollItem = { id: string; done: boolean };

// Nudges the scroll to the next item once the current one is ticked done
// *while the athlete is still working forward* (not when they've scrolled
// back up to fix an earlier one) — split out of useBlockAutoScroll to keep
// that hook's activation-jump logic and this completion-follow logic
// separately scannable.
function useCompletionNudge(
  items: AutoScrollItem[],
  prevDoneIds: MutableRefObject<Set<string>>,
  cardLayouts: MutableRefObject<Map<string, LayoutRectangle>>,
  scrollY: MutableRefObject<number>,
  viewportHeight: number,
  scrollItemIntoView: (id: string, animated: boolean) => void,
) {
  useEffect(() => {
    const doneNow = new Set(items.filter((it) => it.done).map((it) => it.id));
    const justCompletedIdx = items.findIndex(
      (it) => doneNow.has(it.id) && !prevDoneIds.current.has(it.id),
    );
    prevDoneIds.current = doneNow;

    if (justCompletedIdx === -1) return;
    const next = items[justCompletedIdx + 1];
    if (!next) return;

    // Only follow the completion forward if the next card is actually below
    // the fold. If it's already on screen the athlete can see it — and if
    // they'd scrolled up to re-check an earlier card, yanking the viewport
    // down would fight them.
    const nextLayout = cardLayouts.current.get(next.id);
    const nextBelowViewport =
      !nextLayout ||
      viewportHeight === 0 ||
      nextLayout.y >= scrollY.current + viewportHeight;
    if (nextBelowViewport) scrollItemIntoView(next.id, true);
  }, [
    items,
    prevDoneIds,
    cardLayouts,
    scrollY,
    viewportHeight,
    scrollItemIntoView,
  ]);
}

/**
 * Keeps a block's ScrollView pointed at the "right" card without the athlete
 * scrolling manually: the *first* time the block becomes the active page in
 * this screen visit (Next block / Prev / a tab tap), jumps to the first
 * not-yet-completed item (the top of the list if nothing has been started
 * yet). Later re-activations within the same visit (e.g. swiping back to a
 * block you intentionally scrolled past) leave the scroll position alone —
 * otherwise it'd fight an athlete who skipped a card on purpose. It also
 * nudges the next item into view once the current one is ticked done *while
 * the athlete is still working forward* (not when they've scrolled back up
 * to fix an earlier one).
 *
 * `isActive` rather than a block key: BlockContent mounts one persistent
 * BlockPage per block in a horizontal pager, so a page's block id never
 * changes over its lifetime — only which page is on screen does. That same
 * persistence is what makes `hasAutoScrolledRef` below "once per block per
 * screen visit": it only resets when the session player screen itself is
 * remounted (leaving and reopening the program).
 *
 * `items` is caller-supplied so both a plain block (one item per exercise)
 * and a superset block (one item per round) can share this hook.
 */
export function useBlockAutoScroll(isActive: boolean, items: AutoScrollItem[]) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const contentHeight = useRef(0);
  const scrollY = useRef(0);
  const cardLayouts = useRef(new Map<string, LayoutRectangle>());
  const prevDoneIds = useRef(new Set<string>());
  // Target for a card that isn't measured yet (e.g. its block just mounted)
  // — registerCardLayout resolves this once that measurement comes in.
  const pendingScroll = useRef<{ id: string; animated: boolean } | null>(null);
  // Read by the block-activation effect without being a dependency of it —
  // that effect fires on activation only, not on every completion update.
  const latestItems = useRef(items);
  latestItems.current = items;

  const scrollItemIntoView = useCallback(
    (id: string, animated: boolean) => {
      const layout = cardLayouts.current.get(id);
      if (!layout || viewportHeight === 0) {
        pendingScroll.current = { id, animated };
        return;
      }
      // Aim to vertically centre the card, but never scroll past the real end
      // of the content — the ScrollView carries only a small bottom padding
      // now, so a short block clamps here instead of showing dead space.
      const targetY = Math.min(
        Math.max(0, contentHeight.current - viewportHeight),
        Math.max(0, layout.y + layout.height / 2 - viewportHeight / 2),
      );
      scrollRef.current?.scrollTo({ y: targetY, animated });
    },
    [viewportHeight],
  );

  // Read by the activation effect without being a dependency of it — its
  // identity changes whenever `viewportHeight` does (the soft keyboard
  // resizing the ScrollView on Android is enough), and that must not re-fire
  // the "jump to first incomplete" jump mid-edit.
  const scrollItemIntoViewRef = useRef(scrollItemIntoView);
  scrollItemIntoViewRef.current = scrollItemIntoView;

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

  // Block became the active page: jump to the first not-yet-completed item.
  // Also resets prevDoneIds so the completion-tracking effect below doesn't
  // mistake "entering a block with some items already done" for "just
  // finished one".
  const wasActive = useRef(false);
  const hasAutoScrolledRef = useRef(false);
  useEffect(() => {
    if (isActive && !wasActive.current) {
      const current = latestItems.current;
      prevDoneIds.current = new Set(
        current.filter((it) => it.done).map((it) => it.id),
      );
      if (!hasAutoScrolledRef.current) {
        hasAutoScrolledRef.current = true;
        const target = current.find((it) => !it.done) ?? current[0];
        if (target) scrollItemIntoViewRef.current(target.id, false);
      }
    }
    wasActive.current = isActive;
  }, [isActive]);

  useCompletionNudge(
    items,
    prevDoneIds,
    cardLayouts,
    scrollY,
    viewportHeight,
    scrollItemIntoView,
  );

  return {
    scrollRef,
    viewportHeight,
    onViewportLayout: (e: LayoutChangeEvent) =>
      setViewportHeight(e.nativeEvent.layout.height),
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    onContentSizeChange: (_w: number, h: number) => {
      contentHeight.current = h;
    },
    registerCardLayout,
  };
}
