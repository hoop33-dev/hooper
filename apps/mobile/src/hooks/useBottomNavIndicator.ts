import { useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { easing } from "@/src/constants/theme";

const INDICATOR_WIDTH = 28;

// Each tab switch in BottomNav is a `router.replace` to a whole different
// screen, so BottomNav itself unmounts and remounts fresh rather than
// persisting as one instance — a plain useSharedValue would always animate
// from the tapped tab's own resting position, never from wherever the
// indicator actually was. Module-level state survives that remount (same JS
// module, still loaded) so the new instance can animate the indicator in
// from the previously active tab instead of jumping straight to place.
let lastActiveIndex = 0;

/** Drives BottomNav's active-tab indicator bar, sliding it between evenly
 * spaced tab slots (measured via `onLayout` on the tab row) instead of
 * jumping instantly. */
export function useBottomNavIndicator(activeIndex: number) {
  const [slotWidth, setSlotWidth] = useState(0);
  const indicatorIndex = useSharedValue(lastActiveIndex);

  useEffect(() => {
    indicatorIndex.value = withTiming(activeIndex, { duration: easing.fast });
    lastActiveIndex = activeIndex;
  }, [activeIndex, indicatorIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          indicatorIndex.value * slotWidth + (slotWidth - INDICATOR_WIDTH) / 2,
      },
    ],
  }));

  function handleRowLayout(e: LayoutChangeEvent, tabCount: number) {
    setSlotWidth(e.nativeEvent.layout.width / tabCount);
  }

  return { slotWidth, indicatorStyle, handleRowLayout };
}

export { INDICATOR_WIDTH };
