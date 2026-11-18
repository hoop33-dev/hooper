import { Caption, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import {
  sequenceSetSteps,
  type SequenceBlockExercise,
} from "@/src/lib/sequenceDisplay";
import { memo, useMemo } from "react";
import { View } from "react-native";

import {
  FieldBox,
  SetDoneButton,
  SetFieldRow,
  type SetRowState,
} from "../ExerciseSetsCard";
import { ChainIcon } from "../icons";
import { SequenceStepList } from "./SequenceStepList";

/** A sequence's row inside a superset round card: its compact step list
 * for this round, then the round's value boxes and done button — the same
 * row a plain exercise gets (see RoundExerciseRow in SupersetBlock). */
export const SequenceRoundRow = memo(function SequenceRoundRow({
  blockExercise,
  setIndex,
  set,
  laterRounds,
}: {
  blockExercise: SequenceBlockExercise;
  setIndex: number;
  set: SetRowState | undefined;
  /** Must be referentially stable — see SupersetBlock. */
  laterRounds: number[];
}) {
  const { sequence } = blockExercise;
  const measurements = useMemo(
    () =>
      sortByUnitTypePriority(
        blockExercise.measurements.filter((m) => m.set_index === setIndex),
      ),
    [blockExercise, setIndex],
  );
  const done = set?.done ?? false;

  return (
    <View className="gap-2 px-4 py-3">
      <View className="flex-row items-center gap-2">
        <ChainIcon size={15} color={colors.brandOrange} />
        <Title
          className={`flex-1 ${done ? "text-text-secondary" : "text-text-primary"}`}
          numberOfLines={1}>
          {sequence.name}
        </Title>
        <Caption>
          Set {setIndex + 1} of {blockExercise.sets}
        </Caption>
      </View>
      <View style={{ opacity: done ? 0.5 : 1 }}>
        <SequenceStepList
          steps={sequenceSetSteps(sequence, setIndex)}
          compact
        />
      </View>
      <SetFieldRow done={done}>
        {measurements.map((m, i) => (
          <FieldBox
            key={m.position}
            index={i}
            unitType={m.unit_type}
            value={set?.values[m.position]}
            done={done}
            blockExerciseId={blockExercise.id}
            setIndex={setIndex}
            position={m.position}
            laterSetIndices={laterRounds}
          />
        ))}
        <SetDoneButton
          done={done}
          blockExerciseId={blockExercise.id}
          setIndex={setIndex}
        />
      </SetFieldRow>
    </View>
  );
});
