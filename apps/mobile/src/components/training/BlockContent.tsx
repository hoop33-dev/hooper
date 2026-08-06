import type { AthleteBlock, AthleteBlockExercise } from "@hooper/api";
import { H4, Meta } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { ScrollView, View } from "react-native";

import { ExerciseSetsCard, type SetRowState } from "./ExerciseSetsCard";
import { SupersetBlock } from "./SupersetBlock";

type BlockContentProps = {
  block: AthleteBlock;
  setsByBlockExercise: Record<string, SetRowState[]>;
  onFieldTap: (blockExercise: AthleteBlockExercise, setIndex: number, position: number) => void;
  onSetDone: (blockExerciseId: string, setIndex: number) => void;
};

export function BlockContent({
  block,
  setsByBlockExercise,
  onFieldTap,
  onSetDone,
}: BlockContentProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      className="flex-1">
      <View className="mb-4 flex-row items-center gap-2.5">
        <View className="h-5 w-1 rounded-full" style={{ backgroundColor: colors.brandOrange }} />
        <View>
          <H4 style={{ color: colors.brandOrange }}>{block.name}</H4>
          <Meta className="mt-0.5">
            {block.exercises.length} exercise{block.exercises.length === 1 ? "" : "s"}
          </Meta>
        </View>
      </View>

      {block.is_superset ? (
        <SupersetBlock
          block={block}
          setsByBlockExercise={setsByBlockExercise}
          onFieldTap={(beId, setIndex, position) => {
            const be = block.exercises.find((e) => e.id === beId);
            if (be) onFieldTap(be, setIndex, position);
          }}
          onSetDone={onSetDone}
        />
      ) : (
        block.exercises.map((be) => (
          <ExerciseSetsCard
            key={be.id}
            blockExercise={be}
            sets={setsByBlockExercise[be.id] ?? []}
            onFieldTap={(setIndex, position) => onFieldTap(be, setIndex, position)}
            onSetDone={(setIndex) => onSetDone(be.id, setIndex)}
          />
        ))
      )}
    </ScrollView>
  );
}
