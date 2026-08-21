import { H4, Meta } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useBlockAutoScroll } from "@/src/hooks/useBlockAutoScroll";
import type { AthleteBlock } from "@hooper/api";
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

/** A single block's vertically-scrolling exercise list — one page inside the
 * horizontal block pager in BlockContent. */
export function BlockPage({
  block,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
}: BlockPageProps) {
  const { scrollRef, onViewportLayout, registerCardLayout } =
    useBlockAutoScroll(block, setsByBlockExercise);

  return (
    <ScrollView
      ref={scrollRef}
      onLayout={onViewportLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      className="flex-1">
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
          </Meta>
        </View>
      </View>

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
