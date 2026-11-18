import { H4, Meta } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import {
  useBlockAutoScroll,
  type AutoScrollItem,
} from "@/src/hooks/useBlockAutoScroll";
import { isSequenceBlockExercise } from "@/src/lib/sequenceDisplay";
import type { AthleteBlock } from "@hooper/api";
import { memo, useMemo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { ExerciseSetsCard, type SetRowState } from "./ExerciseSetsCard";
import { SequenceSetsCard } from "./sequence/SequenceSetsCard";
import { SupersetBlock } from "./SupersetBlock";

type BlockPageProps = {
  block: AthleteBlock;
  /** True when this is the block currently on screen in the pager — drives
   * the "jump to first incomplete card" auto-scroll on block switch. */
  isActive: boolean;
  setsByBlockExercise: Record<string, SetRowState[]>;
};

function isExerciseFullyDone(sets: SetRowState[] | undefined): boolean {
  return !!sets && sets.length > 0 && sets.every((s) => s.done);
}

/** One auto-scroll item per exercise for a plain block, or one per round for
 * a superset block (since the athlete completes a whole round at a time). */
function useBlockPageAutoScroll(
  block: AthleteBlock,
  isActive: boolean,
  setsByBlockExercise: Record<string, SetRowState[]>,
  rounds: number,
) {
  const items = useMemo<AutoScrollItem[]>(() => {
    if (!block.is_superset) {
      return block.exercises.map((be) => ({
        id: be.id,
        done: isExerciseFullyDone(setsByBlockExercise[be.id]),
      }));
    }
    return Array.from({ length: rounds }, (_, roundIndex) => ({
      id: `round-${roundIndex}`,
      done: block.exercises.every(
        (be) => setsByBlockExercise[be.id]?.[roundIndex]?.done ?? false,
      ),
    }));
  }, [block, setsByBlockExercise, rounds]);

  return useBlockAutoScroll(isActive, items);
}

/** A plain block's card for one placement: the set-by-set sequence card,
 * or the regular exercise card. */
const PlacementCard = memo(function PlacementCard(
  props: React.ComponentProps<typeof ExerciseSetsCard>,
) {
  const { blockExercise } = props;
  return isSequenceBlockExercise(blockExercise) ? (
    <SequenceSetsCard {...props} blockExercise={blockExercise} />
  ) : (
    <ExerciseSetsCard {...props} />
  );
});

/** "2 exercises · 1 sequence" — sequences counted on their own. */
function placementCountLabel(block: AthleteBlock): string {
  const sequences = block.exercises.filter(isSequenceBlockExercise).length;
  const exercises = block.exercises.length - sequences;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  return [
    exercises || !sequences ? plural(exercises, "exercise") : null,
    sequences ? plural(sequences, "sequence") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function BlockHeader({
  block,
  rounds,
}: {
  block: AthleteBlock;
  rounds: number;
}) {
  return (
    <View className="mb-4 flex-row items-center gap-2.5">
      <View
        className="h-5 w-1 rounded-full"
        style={{ backgroundColor: colors.brandOrange }}
      />
      <View>
        <H4 style={{ color: colors.brandOrange }}>{block.name}</H4>
        <Meta className="mt-0.5">
          {placementCountLabel(block)}
          {block.is_superset
            ? ` · ${rounds} round${rounds === 1 ? "" : "s"}`
            : ""}
        </Meta>
      </View>
    </View>
  );
}

/** A single block's vertically-scrolling exercise list — one page inside the
 * horizontal block pager in BlockContent. */
function BlockPageImpl({
  block,
  isActive,
  setsByBlockExercise,
}: BlockPageProps) {
  const rounds = block.sets ?? block.exercises[0]?.sets ?? 0;
  const {
    scrollRef,
    onViewportLayout,
    onScroll,
    onContentSizeChange,
    registerCardLayout,
  } = useBlockPageAutoScroll(block, isActive, setsByBlockExercise, rounds);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onLayout={onViewportLayout}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      className="flex-1">
      <BlockHeader block={block} rounds={rounds} />

      {block.is_superset ? (
        <SupersetBlock
          block={block}
          setsByBlockExercise={setsByBlockExercise}
          onCardLayout={registerCardLayout}
        />
      ) : (
        block.exercises.map((be) => (
          <View
            key={be.id}
            onLayout={(e) => registerCardLayout(be.id, e.nativeEvent.layout)}>
            <PlacementCard
              blockExercise={be}
              sets={setsByBlockExercise[be.id] ?? EMPTY_SETS}
            />
          </View>
        ))
      )}
    </Animated.ScrollView>
  );
}

const EMPTY_SETS: SetRowState[] = [];

/** Re-renders only when something on *this* page changed: its block, its
 * active flag, or the set state of one of its own exercises. Every page gets
 * the session-wide sets map, so without this a tick anywhere re-rendered
 * every mounted page. */
export const BlockPage = memo(BlockPageImpl, (prev, next) => {
  if (prev.block !== next.block || prev.isActive !== next.isActive) {
    return false;
  }
  return prev.block.exercises.every(
    (be) => prev.setsByBlockExercise[be.id] === next.setsByBlockExercise[be.id],
  );
});
