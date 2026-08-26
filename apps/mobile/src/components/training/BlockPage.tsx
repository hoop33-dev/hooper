import { H4, Meta } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import {
  useBlockAutoScroll,
  type AutoScrollItem,
} from "@/src/hooks/useBlockAutoScroll";
import type { AthleteBlock } from "@hooper/api";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { ExerciseSetsCard, type SetRowState } from "./ExerciseSetsCard";
import { SupersetBlock } from "./SupersetBlock";

type BlockPageProps = {
  block: AthleteBlock;
  setsByBlockExercise: Record<string, SetRowState[]>;
  onValueChange: (
    blockExerciseId: string,
    setIndex: number,
    position: number,
    value: number,
  ) => void;
  onSetDone: (blockExerciseId: string, setIndex: number) => void;
};

function isExerciseFullyDone(sets: SetRowState[] | undefined): boolean {
  return !!sets && sets.length > 0 && sets.every((s) => s.done);
}

/** One auto-scroll item per exercise for a plain block, or one per round for
 * a superset block (since the athlete completes a whole round at a time). */
function useBlockPageAutoScroll(
  block: AthleteBlock,
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

  return useBlockAutoScroll(block.id, items);
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
          {block.exercises.length} exercise
          {block.exercises.length === 1 ? "" : "s"}
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
export function BlockPage({
  block,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
}: BlockPageProps) {
  const rounds = block.sets ?? block.exercises[0]?.sets ?? 0;
  const { scrollRef, viewportHeight, onViewportLayout, registerCardLayout } =
    useBlockPageAutoScroll(block, setsByBlockExercise, rounds);

  // Half the viewport height, so even the last card in the list has enough
  // room below it to be scrolled to a vertically-centered position instead
  // of the scroll clamping at the bottom of the content.
  const paddingBottom = Math.max(100, viewportHeight / 2);

  return (
    <ScrollView
      ref={scrollRef}
      onLayout={onViewportLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom }}
      className="flex-1">
      <BlockHeader block={block} rounds={rounds} />

      {block.is_superset ? (
        <SupersetBlock
          block={block}
          setsByBlockExercise={setsByBlockExercise}
          onValueChange={onValueChange}
          onSetDone={onSetDone}
          onCardLayout={registerCardLayout}
        />
      ) : (
        block.exercises.map((be) => (
          <View
            key={be.id}
            onLayout={(e) => registerCardLayout(be.id, e.nativeEvent.layout)}>
            <ExerciseSetsCard
              blockExercise={be}
              sets={setsByBlockExercise[be.id] ?? []}
              onValueChange={(setIndex, position, value) =>
                onValueChange(be.id, setIndex, position, value)
              }
              onSetDone={(setIndex) => onSetDone(be.id, setIndex)}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}
