import { Caption, H4, Meta, Overline, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import type { AthleteSequence } from "@hooper/api";
import { View } from "react-native";

import { CoachNotes, TickAllButton } from "../ExerciseSetsCard";
import { ChainIcon } from "../icons";

/** "SEQUENCE" kicker, name, step count, done count and tick-all. */
export function SequenceHeader({
  sequence,
  notes,
  doneCount,
  total,
  onTickAll,
}: {
  sequence: AthleteSequence;
  notes: string | null;
  doneCount: number;
  total: number;
  onTickAll: () => void;
}) {
  const allDone = total > 0 && doneCount === total;
  const steps = sequence.steps.length;
  return (
    <View className="px-4 py-3">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center gap-1.5">
            <ChainIcon size={14} color={colors.brandOrange} />
            <Overline style={{ color: colors.brandOrange }}>Sequence</Overline>
          </View>
          <Title
            className={allDone ? "text-text-secondary" : "text-text-primary"}>
            {sequence.name}
          </Title>
          <Meta className="mt-0.5">
            {steps} step{steps === 1 ? "" : "s"}
          </Meta>
        </View>
        <View className="items-end gap-1.5">
          <View className="flex-row items-baseline">
            <H4
              style={{
                color: allDone ? colors.success : colors.brandOrange,
              }}>
              {doneCount}
            </H4>
            <Caption>/{total}</Caption>
          </View>
          <TickAllButton allDone={allDone} onPress={onTickAll} />
        </View>
      </View>
      {notes ? <CoachNotes notes={notes} /> : null}
    </View>
  );
}
