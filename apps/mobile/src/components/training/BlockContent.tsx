import { useBlockAutoAdvance } from "@/src/hooks/useBlockAutoAdvance";
import { useBlockPager } from "@/src/hooks/useBlockPager";
import type { AthleteBlock } from "@hooper/api";
import { useWindowDimensions, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

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
  onApplyForward: (
    blockExerciseId: string,
    position: number,
    value: number,
    targetSetIndices: number[],
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
  onApplyForward,
  onSetDone,
  onBlockIdxChange,
  scrollX,
}: BlockContentProps) {
  const { width: pageWidth } = useWindowDimensions();
  const {
    scrollRef,
    initialContentOffset,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
  } = useBlockPager({
    blockCount: blocks.length,
    blockIdx,
    pageWidth,
    onBlockIdxChange,
    scrollX,
  });

  useBlockAutoAdvance(blocks, blockIdx, setsByBlockExercise, onBlockIdxChange);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
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
            onApplyForward={onApplyForward}
            onSetDone={onSetDone}
          />
        </View>
      ))}
    </Animated.ScrollView>
  );
}
