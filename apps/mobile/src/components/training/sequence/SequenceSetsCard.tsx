import { Caption, H2 } from "@/src/components/ui";
import { bodyFont, colors } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import { formatLoggedSet } from "@/src/lib/measurementSummary";
import {
  changesLabel,
  sequenceChainLabel,
  sequenceChangeCount,
  sequenceSetSteps,
  type SequenceBlockExercise,
} from "@/src/lib/sequenceDisplay";
import type { AthleteSequence } from "@hooper/api";
import { Pressable, Text, View } from "react-native";
import { Path, Svg } from "react-native-svg";

import {
  FieldBox,
  type GroupSetTarget,
  type SetRowState,
} from "../ExerciseSetsCard";
import { SequenceHeader } from "./SequenceHeader";
import { SequenceStepList } from "./SequenceStepList";
import { useSequenceSetView } from "./useSequenceSetView";

type Props = {
  blockExercise: SequenceBlockExercise;
  sets: SetRowState[];
  onValueChange: (setIndex: number, position: number, value: number) => void;
  onApplyForward: (
    position: number,
    value: number,
    targetSetIndices: number[],
  ) => void;
  onSetDone: (setIndex: number) => void;
  onSetManyDone: (targets: GroupSetTarget[], done: boolean) => void;
};

function Tick({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 8l4 4 6-7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SetPager({
  sets,
  view,
  onView,
}: {
  sets: SetRowState[];
  view: number;
  onView: (i: number) => void;
}) {
  return (
    <View className="flex-row gap-1.5 px-4 pb-3">
      {sets.map((s, i) => {
        const on = i === view;
        const tone = on
          ? "#fff"
          : s.done
            ? colors.success
            : colors.textTertiary;
        return (
          <Pressable
            key={i}
            onPress={() => onView(i)}
            accessibilityLabel={`Set ${i + 1}`}
            className="h-8 flex-1 flex-row items-center justify-center gap-1 rounded-lg"
            style={{
              borderWidth: 1.5,
              borderColor: on
                ? colors.brandOrange
                : s.done
                  ? "rgba(56,161,105,0.3)"
                  : colors.borderSubtle,
              backgroundColor: on
                ? "rgba(241,88,37,0.12)"
                : s.done
                  ? "rgba(56,161,105,0.08)"
                  : "transparent",
            }}>
            {s.done ? <Tick color={colors.success} size={10} /> : null}
            <Text
              style={{
                fontFamily: bodyFont("700"),
                fontSize: 12,
                color: tone,
              }}>
              {i + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LogButton({
  setIndex,
  done,
  onPress,
}: {
  setIndex: number;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2.5 flex-row items-center justify-center gap-2 rounded-xl py-3"
      style={{
        backgroundColor: done ? "rgba(56,161,105,0.08)" : colors.brandOrange,
        borderWidth: 1,
        borderColor: done ? "rgba(56,161,105,0.3)" : colors.brandOrange,
      }}>
      <Tick color={done ? colors.success : "#fff"} size={13} />
      <Text
        style={{
          fontFamily: bodyFont(done ? "700" : "800"),
          fontSize: 14,
          color: done ? colors.success : "#fff",
        }}>
        {done
          ? `Set ${setIndex + 1} logged. Tap to undo`
          : `Log set ${setIndex + 1}`}
      </Text>
    </Pressable>
  );
}

function SetTitle({
  sequence,
  view,
  total,
}: {
  sequence: AthleteSequence;
  view: number;
  total: number;
}) {
  const changes = sequenceChangeCount(sequence, view);
  return (
    <View className="mb-2 flex-row items-baseline gap-2">
      <H2 className="uppercase">Set {view + 1}</H2>
      <Caption className="flex-1">of {total}</Caption>
      {view === 0 ? null : (
        <Caption style={changes ? { color: colors.brandOrange } : undefined}>
          {changes ? changesLabel(changes) : "No changes"}
        </Caption>
      )}
    </View>
  );
}

function SetPanel({
  blockExercise,
  sets,
  view,
  onValueChange,
  onApplyForward,
  onSetDone,
}: Omit<Props, "onSetManyDone"> & { view: number }) {
  const set = sets[view]!;
  const measurements = sortByUnitTypePriority(
    blockExercise.measurements.filter((m) => m.set_index === view),
  );
  const later = sets.map((_, i) => i).filter((i) => i > view);
  return (
    <View className="border-border-subtle border-t px-4 py-3.5">
      <SetTitle
        sequence={blockExercise.sequence}
        view={view}
        total={sets.length}
      />
      <SequenceStepList
        steps={sequenceSetSteps(blockExercise.sequence, view)}
      />
      {measurements.length ? (
        <View className="mt-3 flex-row gap-2">
          {measurements.map((m, i) => (
            <FieldBox
              key={m.position}
              index={i}
              unitType={m.unit_type}
              value={set.values[m.position]}
              done={set.done}
              hasLaterSets={later.length > 0}
              onChange={(value) => onValueChange(view, m.position, value)}
              onApplyForward={(value) =>
                onApplyForward(m.position, value, later)
              }
            />
          ))}
        </View>
      ) : null}
      <LogButton
        setIndex={view}
        done={set.done}
        onPress={() => onSetDone(view)}
      />
    </View>
  );
}

/** Every set logged: one line per set, its chain and what was logged. */
function DoneSummary({
  blockExercise,
  sets,
}: {
  blockExercise: Props["blockExercise"];
  sets: SetRowState[];
}) {
  return (
    <View className="px-4 pb-1.5">
      {sets.map((s, i) => (
        <View
          key={i}
          className="border-border-subtle flex-row items-center gap-2.5 border-t py-2">
          <Tick color={colors.success} size={13} />
          <Text
            style={{
              width: 40,
              fontFamily: bodyFont("600"),
              fontSize: 13,
              color: colors.textSecondary,
            }}>
            Set {i + 1}
          </Text>
          <Caption className="min-w-0 flex-1" numberOfLines={1}>
            {sequenceChainLabel(blockExercise.sequence, i)}
          </Caption>
          <Text
            style={{
              fontFamily: bodyFont("600"),
              fontSize: 12,
              color: colors.success,
            }}>
            {formatLoggedSet(
              blockExercise.measurements.filter((m) => m.set_index === i),
              s.values,
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** A sequence in a plain block, one set at a time (design direction B:
 * "set-by-set stack"). Each set lists its steps, flags the ones it swaps,
 * and logs the whole run: 6 reps = 6 full runs of the chain. */
export function SequenceSetsCard(props: Props) {
  const { blockExercise, sets, onSetManyDone } = props;
  const { view, setView, collapsed } = useSequenceSetView(sets);
  const doneCount = sets.filter((s) => s.done).length;
  const allDone = sets.length > 0 && doneCount === sets.length;

  return (
    <View
      className="bg-surface-2 mb-3 overflow-hidden rounded-2xl"
      style={{
        borderWidth: 1.5,
        borderColor: collapsed ? "rgba(56,161,105,0.25)" : colors.borderSubtle,
      }}>
      <SequenceHeader
        sequence={blockExercise.sequence}
        notes={blockExercise.notes}
        doneCount={doneCount}
        total={sets.length}
        onTickAll={() =>
          onSetManyDone(
            sets.map((_, setIndex) => ({
              blockExerciseId: blockExercise.id,
              setIndex,
            })),
            !allDone,
          )
        }
      />
      {collapsed ? (
        <DoneSummary blockExercise={blockExercise} sets={sets} />
      ) : sets.length ? (
        <>
          <SetPager sets={sets} view={view} onView={setView} />
          <SetPanel {...props} view={view} />
        </>
      ) : null}
    </View>
  );
}
