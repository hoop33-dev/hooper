import { useBlockAutoAdvance } from "@/src/hooks/useBlockAutoAdvance";
import { useBlockPager } from "@/src/hooks/useBlockPager";
import type { AthleteBlock } from "@hooper/api";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from "react-native-reanimated";

import { BlockPage } from "./BlockPage";
import type { SetRowState } from "./ExerciseSetsCard";

/** Lets the screen start a block change's slide before it re-renders. */
export type BlockPagerHandle = { scrollToBlock: (index: number) => void };

type BlockContentProps = {
  blocks: AthleteBlock[];
  blockIdx: number;
  setsByBlockExercise: Record<string, SetRowState[]>;
  onBlockIdxChange: (index: number) => void;
  /** Live pixel scroll offset of this pager — read by BlockTabs to move its
   * indicator and highlight the active tab continuously as the user swipes. */
  scrollX: SharedValue<number>;
  pagerRef?: Ref<BlockPagerHandle>;
};

/** The page the pager is currently over (rounded), tracked on the UI thread
 * and only reported to JS when it changes — i.e. once per page crossed, not
 * per frame. Drives which pages are mounted while a swipe is in flight,
 * before `blockIdx` itself updates on settle. */
function useLivePage(
  scrollX: SharedValue<number>,
  pageWidth: number,
  initial: number,
) {
  const [page, setPage] = useState(initial);
  useAnimatedReaction(
    () => (pageWidth > 0 ? Math.round(scrollX.value / pageWidth) : 0),
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(setPage)(current);
      }
    },
    [pageWidth],
  );
  return page;
}

/** Which block pages are mounted: the neighbours of the active page and of
 * the page under the finger, plus anything mounted before. Mounting every
 * block's full tree up front made opening the player slow and kept a huge
 * native view tree alive under every scroll; this only ever grows, so a
 * visited page keeps its scroll position and once-per-visit auto-scroll
 * state. Unmounted pages are fixed-width placeholders, so the pager's
 * offsets and paging are unchanged. */
function useMountedPages(blockCount: number, centres: number[]) {
  const mounted = useRef(new Set<number>());
  for (const centre of centres) {
    for (let i = centre - 1; i <= centre + 1; i++) {
      if (i >= 0 && i < blockCount) mounted.current.add(i);
    }
  }
  return mounted.current;
}

export function BlockContent({
  blocks,
  blockIdx,
  setsByBlockExercise,
  onBlockIdxChange,
  scrollX,
  pagerRef,
}: BlockContentProps) {
  const { width: pageWidth } = useWindowDimensions();
  const { scrollRef, scrollToBlock, initialContentOffset, ...handlers } =
    useBlockPager({
      blockCount: blocks.length,
      blockIdx,
      pageWidth,
      onBlockIdxChange,
      scrollX,
    });

  useImperativeHandle(pagerRef, () => ({ scrollToBlock }), [scrollToBlock]);

  const advanceTo = useCallback(
    (index: number) => {
      scrollToBlock(index);
      onBlockIdxChange(index);
    },
    [scrollToBlock, onBlockIdxChange],
  );
  useBlockAutoAdvance(blocks, blockIdx, setsByBlockExercise, advanceTo);

  const livePage = useLivePage(scrollX, pageWidth, blockIdx);
  const mounted = useMountedPages(blocks.length, [blockIdx, livePage]);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={handlers.onScroll}
      scrollEventThrottle={16}
      onScrollBeginDrag={handlers.onScrollBeginDrag}
      onScrollEndDrag={handlers.onScrollEndDrag}
      onMomentumScrollBegin={handlers.onMomentumScrollBegin}
      onMomentumScrollEnd={handlers.onMomentumScrollEnd}
      contentOffset={initialContentOffset}
      contentContainerStyle={{ height: "100%" }}
      className="flex-1">
      {blocks.map((block, i) => (
        <View key={block.id} style={{ width: pageWidth, height: "100%" }}>
          {mounted.has(i) ? (
            <BlockPage
              block={block}
              isActive={i === blockIdx}
              setsByBlockExercise={setsByBlockExercise}
            />
          ) : null}
        </View>
      ))}
    </Animated.ScrollView>
  );
}
