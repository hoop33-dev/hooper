import { useBlockAutoAdvance } from "@/src/hooks/useBlockAutoAdvance";
import type { AthleteBlock } from "@hooper/api";
import { useEffect, useRef, useState } from "react";
import {
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  type SharedValue,
} from "react-native-reanimated";

import { BlockPage } from "./BlockPage";
import type { SetRowState } from "./ExerciseSetsCard";

type BlockContentProps = {
  blocks: AthleteBlock[];
  blockIdx: number;
  setsByBlockExercise: Record<string, SetRowState[]>;
  onValueChange: (
    blockExerciseId: string,
    setIndex: number,
    position: number,
    value: number,
  ) => void;
  onSetDone: (blockExerciseId: string, setIndex: number) => void;
  onBlockIdxChange: (index: number) => void;
  /** Live pixel scroll offset of this pager — read by BlockTabs to move its
   * indicator and highlight the active tab continuously as the user swipes. */
  scrollX: SharedValue<number>;
};

export function BlockContent({
  blocks,
  blockIdx,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
  onBlockIdxChange,
  scrollX,
}: BlockContentProps) {
  const { width: pageWidth } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  // Tracks the index we last scrolled to (or reported) ourselves, so the
  // sync effect below can tell "blockIdx changed because we scrolled" apart
  // from "blockIdx changed because a tab/footer button was pressed". Without
  // this, our own scroll-driven update bounces straight back into another
  // scrollTo, and rapid tab changes can spiral into an oscillating loop.
  const lastReportedIdx = useRef(blockIdx);
  // True only for the span of a real finger drag — set on onScrollBeginDrag,
  // cleared on its settle (and defensively before every programmatic
  // scrollTo). A programmatic scroll (tab tap, footer nav, auto-advance)
  // never sets it, so we ignore its onMomentumScrollEnd entirely: the
  // parent's `blockIdx` is already the source of truth for those.
  //
  // This is what stops rapid tab switching landing on the wrong tab. Firing
  // several tab taps in a row interrupts each scrollTo's animation with the
  // next one, and every interrupted animation still delivers its own
  // onMomentumScrollEnd reporting the offset it was cancelled at. Those
  // events can also arrive *after* the final animation has settled — at
  // which point any "is this the target?" guard has already been satisfied
  // and cleared — so a stale one sails through and reports an old index,
  // snapping the pager back to a tab the user already passed. Only trusting
  // settles that follow a real drag sidesteps the whole ordering problem.
  const isUserDrag = useRef(false);
  // Frozen at mount — `contentOffset` is only a starting position, not a
  // live-controlled prop; recomputing it from `blockIdx` on every render
  // made the ScrollView snap (unanimated) back to that offset on renders
  // that had nothing to do with scrolling, fighting the animated scrollTo
  // below and compounding the bounce. `scrollX` is seeded here too, not in
  // a `useEffect`: BlockTabs reads it directly on the UI thread to decide
  // which tab is active, which can evaluate before any effect runs — an
  // effect-based seed left a one-frame flash of tab 0 as "active" when
  // resuming a session mid-way through.
  const [initialContentOffset] = useState(() => {
    scrollX.value = blockIdx * pageWidth;
    return { x: blockIdx * pageWidth, y: 0 };
  });

  useEffect(() => {
    if (blockIdx === lastReportedIdx.current) return;
    lastReportedIdx.current = blockIdx;
    isUserDrag.current = false;
    scrollRef.current?.scrollTo({ x: blockIdx * pageWidth, animated: true });
  }, [blockIdx, pageWidth]);

  useBlockAutoAdvance(blocks, blockIdx, setsByBlockExercise, onBlockIdxChange);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  function handleScrollBeginDrag() {
    isUserDrag.current = true;
  }

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!isUserDrag.current) return;
    isUserDrag.current = false;
    const raw = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const index = Math.max(0, Math.min(blocks.length - 1, raw));
    lastReportedIdx.current = index;
    if (index !== blockIdx) onBlockIdxChange(index);
  }

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onScrollBeginDrag={handleScrollBeginDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      contentOffset={initialContentOffset}
      contentContainerStyle={{ height: "100%" }}
      className="flex-1">
      {blocks.map((block, i) => (
        <View key={block.id} style={{ width: pageWidth, height: "100%" }}>
          <BlockPage
            block={block}
            isActive={i === blockIdx}
            setsByBlockExercise={setsByBlockExercise}
            onValueChange={onValueChange}
            onSetDone={onSetDone}
          />
        </View>
      ))}
    </Animated.ScrollView>
  );
}
