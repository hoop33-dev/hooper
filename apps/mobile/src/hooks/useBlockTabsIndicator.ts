import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

/**
 * Drives BlockTabs' underline and "active" tab continuously off the block
 * pager's live scroll position (scrollX), rather than only snapping once a
 * swipe settles: the indicator interpolates between the two adjacent tabs'
 * measured layouts, and the bold/white tab flips as soon as the scroll
 * crosses the halfway point between them.
 */
export function useBlockTabsIndicator(
  scrollX: SharedValue<number>,
  pageWidth: number,
  blockIdx: number,
  tabCount: number,
) {
  const xs = useSharedValue<number[]>(Array(tabCount).fill(0));
  // -1 marks "not yet measured".
  const widths = useSharedValue<number[]>(Array(tabCount).fill(-1));
  const tabScrollX = useSharedValue(0);
  const [activeIdx, setActiveIdx] = useState(blockIdx);

  const onTabsScroll = useAnimatedScrollHandler((e) => {
    tabScrollX.value = e.contentOffset.x;
  });

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

  useAnimatedReaction(
    () => {
      if (tabCount === 0 || pageWidth === 0) return blockIdx;
      const progress = Math.round(
        Math.min(tabCount - 1, Math.max(0, scrollX.value / pageWidth)),
      );
      return widths.value[progress] >= 0 ? progress : blockIdx;
    },
    (result, previous) => {
      if (result !== previous) runOnJS(setActiveIdx)(result);
    },
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

  return { activeIdx, onTabsScroll, handleTabLayout, indicatorStyle };
}
