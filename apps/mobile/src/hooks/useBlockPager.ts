import { useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  type SharedValue,
} from "react-native-reanimated";

// How long the pager must sit still after a gesture before its position
// counts as settled and the page is reported up. Long enough to swallow the
// intermediate momentum-end events a fast multi-swipe produces (and
// Android's duplicate mid-fling momentum-end), short enough to feel
// immediate for everything `blockIdx` drives — none of which is on the
// visible swipe path: the tab bar's indicator and active label track
// `scrollX` on the UI thread and move with the finger regardless.
const SETTLE_QUIET_MS = 150;

type UseBlockPagerArgs = {
  blockCount: number;
  blockIdx: number;
  pageWidth: number;
  onBlockIdxChange: (index: number) => void;
  /** Live pixel scroll offset — written every frame on the UI thread and
   * read by BlockTabs to drive its indicator and active-tab highlight. */
  scrollX: SharedValue<number>;
};

/**
 * Two-way binding between the horizontal block pager's scroll position and
 * the parent-owned `blockIdx`:
 *
 * - Parent `blockIdx` changes (tab tap, footer nav, auto-advance) drive an
 *   animated `scrollTo`.
 * - A finger gesture that settles on a new page reports that page back up
 *   via `onBlockIdxChange` — once, after the scroll comes to rest.
 *
 * `lastReportedIdx` breaks the scroll -> state -> scrollTo feedback loop:
 * the sync effect only scrolls when `blockIdx` moved for a reason other than
 * our own settle report.
 */
export function useBlockPager({
  blockCount,
  blockIdx,
  pageWidth,
  onBlockIdxChange,
  scrollX,
}: UseBlockPagerArgs) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  // The index we last scrolled to (or reported) ourselves — lets the sync
  // effect tell "blockIdx changed because we scrolled" apart from "blockIdx
  // changed because a tab/footer button was pressed". Without it our own
  // scroll-driven update bounces straight back into another scrollTo and
  // rapid tab changes spiral into an oscillating loop.
  const lastReportedIdx = useRef(blockIdx);
  // True from the start of a real finger drag until the next programmatic
  // scroll clears it. A programmatic scroll (tab tap, footer nav,
  // auto-advance) never sets it, so we never treat its settle events as a
  // user landing on a page: the parent's `blockIdx` is already authoritative
  // for those, and acting on the interrupted-animation momentum-end events
  // that rapid tab taps produce is what used to snap the pager back to an
  // already-passed tab.
  const isUserDrag = useRef(false);
  // Where the pager was at the most recent drag-end / momentum-end, and the
  // pending "it's been quiet, commit it" timer. A burst of end events from a
  // fast multi-swipe keeps pushing the deadline out, so we run exactly one
  // commit — with the final resting offset — after the user actually stops,
  // instead of re-rendering the parent on every intermediate event.
  const settleOffsetX = useRef(blockIdx * pageWidth);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Frozen at mount — `contentOffset` is only a starting position, not a
  // live-controlled prop; recomputing it from `blockIdx` on every render
  // made the ScrollView snap (unanimated) back to that offset on renders
  // that had nothing to do with scrolling, fighting the animated scrollTo
  // below. `scrollX` is seeded here too, not in a `useEffect`: BlockTabs
  // reads it directly on the UI thread to decide which tab is active, which
  // can evaluate before any effect runs — an effect-based seed left a
  // one-frame flash of tab 0 as "active" when resuming a session mid-way.
  const [initialContentOffset] = useState(() => {
    scrollX.value = blockIdx * pageWidth;
    return { x: blockIdx * pageWidth, y: 0 };
  });

  function clearSettleTimer() {
    if (settleTimer.current != null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }

  // Record the current offset and (re)arm the quiet timer. Ignored for
  // programmatic scrolls (`!isUserDrag`). Reads the offset straight off the
  // native scroll event — never `scrollX.value`, whose getter is a
  // synchronous JS<->UI round trip that janks the swipe if hit per-event.
  function armSettle(offsetX: number) {
    if (!isUserDrag.current) return;
    settleOffsetX.current = offsetX;
    clearSettleTimer();
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      const raw = Math.round(settleOffsetX.current / pageWidth);
      const index = Math.max(0, Math.min(blockCount - 1, raw));
      lastReportedIdx.current = index;
      if (index !== blockIdx) onBlockIdxChange(index);
    }, SETTLE_QUIET_MS);
  }

  useEffect(() => {
    if (blockIdx === lastReportedIdx.current) return;
    lastReportedIdx.current = blockIdx;
    isUserDrag.current = false;
    clearSettleTimer();
    scrollRef.current?.scrollTo({ x: blockIdx * pageWidth, animated: true });
  }, [blockIdx, pageWidth]);

  // Drop any pending settle if we unmount mid-gesture.
  useEffect(() => clearSettleTimer, []);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  function onScrollBeginDrag() {
    isUserDrag.current = true;
    clearSettleTimer();
  }

  function onScrollEndDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
    armSettle(e.nativeEvent.contentOffset.x);
  }

  // A fling's deceleration phase starts here — a pending settle from
  // onScrollEndDrag would fire mid-flight, so cancel it and let
  // onMomentumScrollEnd re-arm once the pager is at rest.
  function onMomentumScrollBegin() {
    clearSettleTimer();
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    armSettle(e.nativeEvent.contentOffset.x);
  }

  return {
    scrollRef,
    initialContentOffset,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
  };
}
