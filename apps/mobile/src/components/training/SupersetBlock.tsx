import { Meta } from "@/src/components/ui";
import type { AthleteBlock } from "@hooper/api";
import { View, type LayoutRectangle } from "react-native";

import { ExerciseSetsCard, type SetRowState } from "./ExerciseSetsCard";

type SupersetBlockProps = {
  block: AthleteBlock;
  /** blockExerciseId -> per-round state, same shape ExerciseSetsCard expects. */
  setsByBlockExercise: Record<string, SetRowState[]>;
  onValueChange: (
    blockExerciseId: string,
    setIndex: number,
    position: number,
    value: number,
  ) => void;
  onSetDone: (blockExerciseId: string, setIndex: number) => void;
  /** Reports each exercise card's layout within the scrolling block content,
   * so BlockContent can scroll the next one into view on completion. */
  onCardLayout: (blockExerciseId: string, layout: LayoutRectangle) => void;
};

/**
 * A superset/circuit block: every exercise shares the same round count
 * (block.sets). Each exercise still gets its own ExerciseSetsCard — set_index
 * *is* the round number here.
 */
export function SupersetBlock({
  block,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
  onCardLayout,
}: SupersetBlockProps) {
  return (
    <View>
      <Meta className="mb-3">
        {block.sets ?? block.exercises[0]?.sets ?? 0} rounds ·{" "}
        {block.exercises.length} exercises
      </Meta>
      {block.exercises.map((blockExercise) => (
        <View
          key={blockExercise.id}
          onLayout={(e) =>
            onCardLayout(blockExercise.id, e.nativeEvent.layout)
          }>
          <ExerciseSetsCard
            blockExercise={blockExercise}
            sets={setsByBlockExercise[blockExercise.id] ?? []}
            onValueChange={(setIndex, position, value) =>
              onValueChange(blockExercise.id, setIndex, position, value)
            }
            onSetDone={(setIndex) => onSetDone(blockExercise.id, setIndex)}
          />
        </View>
      ))}
    </View>
  );
}
