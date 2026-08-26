import { Caption, H4, Meta, Overline, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import {
  resolveSetExercise,
  resolveSetStyle,
} from "@/src/lib/blockExerciseDisplay";
import type { AthleteBlock, AthleteBlockExercise } from "@hooper/api";
import { View, type LayoutRectangle } from "react-native";

import {
  FieldBox,
  SetDoneButton,
  VideoThumbnail,
  type SetRowState,
} from "./ExerciseSetsCard";

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
  /** Reports each round card's layout within the scrolling block content,
   * keyed "round-{index}", so BlockContent can scroll the next one into view
   * on completion. */
  onCardLayout: (roundKey: string, layout: LayoutRectangle) => void;
};

/** One exercise's row within a round card — thumbnail + title (+ style, if
 * this round overrides it) on top, then this round's value boxes and done
 * button below. No card chrome and no per-exercise done count of its own:
 * those belong to the round card wrapping every exercise's row. */
function RoundExerciseRow({
  blockExercise,
  setIndex,
  set,
  onValueChange,
  onSetDone,
}: {
  blockExercise: AthleteBlockExercise;
  setIndex: number;
  set: SetRowState | undefined;
  onValueChange: (position: number, value: number) => void;
  onSetDone: () => void;
}) {
  const exercise = resolveSetExercise(blockExercise, setIndex);
  const style = resolveSetStyle(blockExercise, setIndex);
  const measurements = sortByUnitTypePriority(
    blockExercise.measurements.filter((m) => m.set_index === setIndex),
  );
  const done = set?.done ?? false;

  return (
    <View className="gap-2 px-4 py-3">
      <View className="flex-row items-center gap-3">
        {exercise.video_url ? (
          <VideoThumbnail
            videoUrl={exercise.video_url}
            videoSource={exercise.video_source}
            videoOrientation={exercise.video_orientation}
            videoThumbnailUrl={exercise.video_thumbnail_url}
            title={exercise.name}
            faded={done}
          />
        ) : null}
        <View className="flex-1">
          <Title className={done ? "text-text-secondary" : "text-text-primary"}>
            {exercise.name}
          </Title>
          {style ? <Meta className="mt-0.5">{style.name}</Meta> : null}
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {measurements.map((m) => (
          <FieldBox
            key={m.position}
            unitType={m.unit_type}
            value={set?.values[m.position]}
            done={done}
            onChange={(value) => onValueChange(m.position, value)}
          />
        ))}
        <SetDoneButton done={done} onPress={onSetDone} />
      </View>
    </View>
  );
}

function RoundCard({
  roundIndex,
  block,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
  onLayout,
}: {
  roundIndex: number;
  block: AthleteBlock;
  setsByBlockExercise: Record<string, SetRowState[]>;
  onValueChange: (
    blockExerciseId: string,
    position: number,
    value: number,
  ) => void;
  onSetDone: (blockExerciseId: string) => void;
  onLayout: (layout: LayoutRectangle) => void;
}) {
  const total = block.exercises.length;
  const doneCount = block.exercises.filter(
    (be) => setsByBlockExercise[be.id]?.[roundIndex]?.done,
  ).length;
  const allDone = doneCount === total && total > 0;

  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
      className="border-border-subtle mb-3 overflow-hidden rounded-2xl border"
      style={{ opacity: allDone ? 0.8 : 1 }}>
      <View className="bg-surface-2 border-border-subtle flex-row items-center justify-between border-b px-4 py-3">
        <Overline>Round {roundIndex + 1}</Overline>
        <View className="flex-row items-baseline">
          <H4
            style={{
              color: allDone ? colors.textSecondary : colors.brandOrange,
            }}>
            {doneCount}
          </H4>
          <Caption>/{total}</Caption>
        </View>
      </View>
      <View className="bg-surface-2">
        {block.exercises.map((be, i) => (
          <View key={be.id}>
            {i > 0 ? <View className="border-border-subtle border-t" /> : null}
            <RoundExerciseRow
              blockExercise={be}
              setIndex={roundIndex}
              set={setsByBlockExercise[be.id]?.[roundIndex]}
              onValueChange={(position, value) =>
                onValueChange(be.id, position, value)
              }
              onSetDone={() => onSetDone(be.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * A superset/circuit block: every exercise shares the same round count
 * (block.sets). Grouped by round — one card per round, each containing every
 * exercise's row for that round — since the athlete works through all
 * exercises in Round 1, then all of Round 2, and so on.
 */
export function SupersetBlock({
  block,
  setsByBlockExercise,
  onValueChange,
  onSetDone,
  onCardLayout,
}: SupersetBlockProps) {
  const rounds = block.sets ?? block.exercises[0]?.sets ?? 0;

  return (
    <View>
      {Array.from({ length: rounds }, (_, roundIndex) => (
        <RoundCard
          key={roundIndex}
          roundIndex={roundIndex}
          block={block}
          setsByBlockExercise={setsByBlockExercise}
          onValueChange={(blockExerciseId, position, value) =>
            onValueChange(blockExerciseId, roundIndex, position, value)
          }
          onSetDone={(blockExerciseId) =>
            onSetDone(blockExerciseId, roundIndex)
          }
          onLayout={(layout) => onCardLayout(`round-${roundIndex}`, layout)}
        />
      ))}
    </View>
  );
}
