import type { LayoutChangeEvent } from "react-native";
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

// Padding kept between an auto-scrolled-into-view tab and the edge of the
// tab bar's visible area, so it doesn't land flush against it.
const EDGE_PADDING = 16;

/**
 * Keeps the active tab scrolled into view, entirely on the UI thread. The
 * tracked reaction value folds "which tab" and "is its layout measured
 * yet" into one number so it also re-fires the moment a previously
 * unmeasured active tab's layout resolves — not just on index changes —
 * which matters when resuming a session mid-way through, where the active
 * tab can start off-screen with nothing else to nudge it into view.
 */
function useAutoScrollActiveTab(
  scrollX: SharedValue<number>,
  pageWidth: number,
  tabCount: number,
  xs: SharedValue<number[]>,
  widths: SharedValue<number[]>,
  tabScrollX: SharedValue<number>,
  viewportWidth: SharedValue<number>,
  tabsScrollRef: ReturnType<typeof useAnimatedRef<Animated.ScrollView>>,
) {
  useAnimatedReaction(
    () => {
      if (tabCount === 0 || pageWidth === 0) return -1;
      const progress = Math.round(
        Math.min(tabCount - 1, Math.max(0, scrollX.value / pageWidth)),
      );
      const measured = widths.value[progress] >= 0 && viewportWidth.value > 0;
      return measured ? progress * 2 + 1 : progress * 2;
    },
    (result) => {
      if (result < 0 || result % 2 === 0) return;
      const index = (result - 1) / 2;
      const width = widths.value[index];
      const x = xs.value[index];
      const visibleStart = tabScrollX.value;
      const visibleEnd = visibleStart + viewportWidth.value;
      let target: number | null = null;
      if (x < visibleStart + EDGE_PADDING) {
        target = Math.max(0, x - EDGE_PADDING);
      } else if (x + width > visibleEnd - EDGE_PADDING) {
        target = x + width - viewportWidth.value + EDGE_PADDING;
      }
      if (target !== null) scrollTo(tabsScrollRef, target, 0, true);
    },
  );
}

/**
 * Drives BlockTabs' underline continuously off the block pager's live
 * scroll position (scrollX) — the indicator interpolates between the two
 * adjacent tabs' measured layouts — and keeps the tab strip scrolled so
 * whichever tab is active stays on screen as the pager crosses into it.
 *
 * The active (bold/white) tab text is NOT driven from here — each tab
 * computes its own active state straight from `scrollX` in a UI-thread
 * `useAnimatedStyle` (see BlockTabs.tsx). Routing that through JS state
 * instead — even coalesced to one commit per frame — still costs a JS
 * round trip and a React re-render, which visibly lags the UI-thread-driven
 * underline on a fast swipe. Reading `scrollX` directly has no such lag.
 */
export function useBlockTabsIndicator(
  scrollX: SharedValue<number>,
  pageWidth: number,
  tabCount: number,
) {
  const xs = useSharedValue<number[]>(Array(tabCount).fill(0));
  // -1 marks "not yet measured".
  const widths = useSharedValue<number[]>(Array(tabCount).fill(-1));
  const tabScrollX = useSharedValue(0);
  const viewportWidth = useSharedValue(0);
  const tabsScrollRef = useAnimatedRef<Animated.ScrollView>();

  const onTabsScroll = useAnimatedScrollHandler((e) => {
    tabScrollX.value = e.contentOffset.x;
  });

  function handleTabsLayout(e: LayoutChangeEvent) {
    viewportWidth.value = e.nativeEvent.layout.width;
  }

  // Update each array via .modify() rather than read-copy-write a whole new
  // array or mutate xs.value[index] directly. On the JS thread, reading
  // `.value` round-trips a snapshot copy from the UI thread, so writing a
  // subscript of that snapshot (xs.value[index] = x) mutates a throwaway
  // copy that's never sent back — the underline never appeared, no matter
  // which tab was active. .modify() instead schedules the mutator to run
  // on the UI thread against the real stored array, so the write actually
  // lands and each tab's layout is preserved even when several onLayout
  // calls land in the same batch.
  function handleTabLayout(index: number, e: LayoutChangeEvent) {
    const { x, width } = e.nativeEvent.layout;
    xs.modify((arr) => {
      "worklet";
      arr[index] = x;
      return arr;
    });
    widths.modify((arr) => {
      "worklet";
      arr[index] = width;
      return arr;
    });
  }

  useAutoScrollActiveTab(
    scrollX,
    pageWidth,
    tabCount,
    xs,
    widths,
    tabScrollX,
    viewportWidth,
    tabsScrollRef,
  );

  const indicatorStyle = useAnimatedStyle(() => {
    if (tabCount === 0 || pageWidth === 0) {
      return { transform: [{ translateX: 0 }], width: 0 };
    }
    const progress = Math.min(
      tabCount - 1,
      Math.max(0, scrollX.value / pageWidth),
    );
    const i0 = Math.floor(progress);
    const i1 = Math.min(tabCount - 1, i0 + 1);
    const w0 = widths.value[i0];
    const w1 = widths.value[i1];
    if (w0 < 0 || w1 < 0) {
      return { transform: [{ translateX: 0 }], width: 0 };
    }
    const x0 = xs.value[i0];
    const x1 = xs.value[i1];
    const frac = progress - i0;
    return {
      transform: [{ translateX: x0 + (x1 - x0) * frac - tabScrollX.value }],
      width: w0 + (w1 - w0) * frac,
    };
  });

  return {
    onTabsScroll,
    handleTabsLayout,
    handleTabLayout,
    indicatorStyle,
    tabsScrollRef,
  };
}
