import type { AthleteBlock } from "@hooper/api";
import { Meta } from "@/src/components/ui";
import { View } from "react-native";

import { ExerciseSetsCard, type SetRowState } from "./ExerciseSetsCard";

type SupersetBlockProps = {
  block: AthleteBlock;
  /** blockExerciseId -> per-round state, same shape ExerciseSetsCard expects. */
  setsByBlockExercise: Record<string, SetRowState[]>;
  onFieldTap: (blockExerciseId: string, setIndex: number, position: number) => void;
  onSetDone: (blockExerciseId: string, setIndex: number) => void;
};

/**
 * A superset/circuit block: every exercise shares the same round count
 * (block.sets). Each exercise still gets its own ExerciseSetsCard — set_index
 * *is* the round number here, so labeling rows "Round" instead of "Set" is
 * the only real difference from a regular block.
 */
export function SupersetBlock({
  block,
  setsByBlockExercise,
  onFieldTap,
  onSetDone,
}: SupersetBlockProps) {
  return (
    <View>
      <Meta className="mb-3">
        {block.sets ?? block.exercises[0]?.sets ?? 0} rounds · {block.exercises.length}{" "}
        exercises
      </Meta>
      {block.exercises.map((blockExercise) => (
        <ExerciseSetsCard
          key={blockExercise.id}
          blockExercise={blockExercise}
          sets={setsByBlockExercise[blockExercise.id] ?? []}
          setLabel="Round"
          onFieldTap={(setIndex, position) =>
            onFieldTap(blockExercise.id, setIndex, position)
          }
          onSetDone={(setIndex) => onSetDone(blockExercise.id, setIndex)}
        />
      ))}
    </View>
  );
}
