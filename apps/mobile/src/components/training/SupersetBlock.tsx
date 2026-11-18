import { Caption, H4, Meta, Overline, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import {
  resolveSetExercise,
  resolveSetStyle,
} from "@/src/lib/blockExerciseDisplay";
import { exerciseMediaItems } from "@/src/lib/exerciseMedia";
import { isSequenceBlockExercise } from "@/src/lib/sequenceDisplay";
import type { AthleteBlock, AthleteBlockExercise } from "@hooper/api";
import { memo, useMemo, useState } from "react";
import { View, type LayoutRectangle } from "react-native";

import { ExerciseMediaThumbnail } from "./ExerciseMediaThumbnail";
import {
  FieldBox,
  SetDoneButton,
  SetFieldRow,
  TickAllButton,
  type SetRowState,
} from "./ExerciseSetsCard";
import { useSetActions } from "./SetActionsContext";
import { SequenceRoundRow } from "./sequence/SequenceRoundRow";
import { ExerciseMediaViewer } from "./videoPlayer/ExerciseMediaViewer";

type SupersetBlockProps = {
  block: AthleteBlock;
  /** blockExerciseId -> per-round state, same shape ExerciseSetsCard expects. */
  setsByBlockExercise: Record<string, SetRowState[]>;
  /** Reports each round card's layout within the scrolling block content,
   * keyed "round-{index}", so BlockContent can scroll the next one into view
   * on completion. Must be referentially stable. */
  onCardLayout: (roundKey: string, layout: LayoutRectangle) => void;
};

/** One exercise's row within a round card — thumbnail + title (+ style, if
 * this round overrides it) on top, then this round's value boxes and done
 * button below. No card chrome and no per-exercise done count of its own:
 * those belong to the round card wrapping every exercise's row. */
const RoundExerciseRow = memo(function RoundExerciseRow({
  blockExercise,
  setIndex,
  set,
  laterRounds,
}: {
  blockExercise: AthleteBlockExercise;
  setIndex: number;
  set: SetRowState | undefined;
  /** The later rounds a value can be copied into — empty on the last round. */
  laterRounds: number[];
}) {
  const exercise = resolveSetExercise(blockExercise, setIndex);
  const style = resolveSetStyle(blockExercise, setIndex);
  const measurements = useMemo(
    () =>
      sortByUnitTypePriority(
        blockExercise.measurements.filter((m) => m.set_index === setIndex),
      ),
    [blockExercise, setIndex],
  );
  const done = set?.done ?? false;
  const media = useMemo(() => exerciseMediaItems(exercise), [exercise]);
  const [viewerStart, setViewerStart] = useState<number | null>(null);

  return (
    <View className="gap-2 px-4 py-3">
      <View className="flex-row items-center gap-3">
        <ExerciseMediaThumbnail
          items={media}
          onOpen={setViewerStart}
          faded={done}
        />
        <View className="flex-1">
          <Title className={done ? "text-text-secondary" : "text-text-primary"}>
            {exercise.name}
          </Title>
          {style ? <Meta className="mt-0.5">{style.name}</Meta> : null}
        </View>
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
      {/* Mounted only while open — see ExerciseHeader. */}
      {viewerStart !== null ? (
        <ExerciseMediaViewer
          startIndex={viewerStart}
          onClose={() => setViewerStart(null)}
          items={media}
          title={exercise.name}
          cue={exercise.description}
        />
      ) : null}
    </View>
  );
});

/** A round card's title bar — round number, done count, and the tick-all
 * button. */
function RoundCardHeader({
  roundIndex,
  doneCount,
  total,
  allDone,
  onTickAll,
}: {
  roundIndex: number;
  doneCount: number;
  total: number;
  allDone: boolean;
  onTickAll: () => void;
}) {
  return (
    <View className="bg-surface-2 border-border-subtle flex-row items-center justify-between border-b px-4 py-3">
      <Overline>Round {roundIndex + 1}</Overline>
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-baseline">
          <H4
            style={{
              color: allDone ? colors.textSecondary : colors.brandOrange,
            }}>
            {doneCount}
          </H4>
          <Caption>/{total}</Caption>
        </View>
        <TickAllButton allDone={allDone} onPress={onTickAll} />
      </View>
    </View>
  );
}

type RoundCardProps = {
  roundIndex: number;
  block: AthleteBlock;
  setsByBlockExercise: Record<string, SetRowState[]>;
  laterRounds: number[];
  onCardLayout: (roundKey: string, layout: LayoutRectangle) => void;
};

function RoundCardImpl({
  roundIndex,
  block,
  setsByBlockExercise,
  laterRounds,
  onCardLayout,
}: RoundCardProps) {
  const { setManyDone } = useSetActions();
  const total = block.exercises.length;
  const doneCount = block.exercises.filter(
    (be) => setsByBlockExercise[be.id]?.[roundIndex]?.done,
  ).length;
  const allDone = doneCount === total && total > 0;

  return (
    <View
      onLayout={(e) =>
        onCardLayout(`round-${roundIndex}`, e.nativeEvent.layout)
      }
      className="border-border-subtle mb-3 overflow-hidden rounded-2xl border"
      style={{ opacity: allDone ? 0.8 : 1 }}>
      <RoundCardHeader
        roundIndex={roundIndex}
        doneCount={doneCount}
        total={total}
        allDone={allDone}
        onTickAll={() =>
          setManyDone(
            block.exercises.map((be) => ({
              blockExerciseId: be.id,
              setIndex: roundIndex,
            })),
            !allDone,
          )
        }
      />
      <View className="bg-surface-2">
        {block.exercises.map((be, i) => {
          const rowProps = {
            setIndex: roundIndex,
            set: setsByBlockExercise[be.id]?.[roundIndex],
            laterRounds,
          };
          return (
            <View key={be.id}>
              {i > 0 ? (
                <View className="border-border-subtle border-t" />
              ) : null}
              {isSequenceBlockExercise(be) ? (
                <SequenceRoundRow blockExercise={be} {...rowProps} />
              ) : (
                <RoundExerciseRow blockExercise={be} {...rowProps} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Re-renders a round card only when one of *its* rows changed — every card
 * gets the whole sets map, so without this a tick in round 1 re-rendered
 * every round. */
const RoundCard = memo(RoundCardImpl, (prev, next) => {
  if (
    prev.block !== next.block ||
    prev.roundIndex !== next.roundIndex ||
    prev.laterRounds !== next.laterRounds ||
    prev.onCardLayout !== next.onCardLayout
  ) {
    return false;
  }
  const r = prev.roundIndex;
  return prev.block.exercises.every(
    (be) =>
      prev.setsByBlockExercise[be.id]?.[r] ===
      next.setsByBlockExercise[be.id]?.[r],
  );
});

/**
 * A superset/circuit block: every exercise shares the same round count
 * (block.sets). Grouped by round — one card per round, each containing every
 * exercise's row for that round — since the athlete works through all
 * exercises in Round 1, then all of Round 2, and so on.
 */
export function SupersetBlock({
  block,
  setsByBlockExercise,
  onCardLayout,
}: SupersetBlockProps) {
  const rounds = block.sets ?? block.exercises[0]?.sets ?? 0;
  // Per-round apply-forward targets, built once so memoised rows and field
  // boxes see the same array every render.
  const laterRoundsByRound = useMemo(
    () =>
      Array.from({ length: rounds }, (_, roundIndex) =>
        Array.from(
          { length: Math.max(0, rounds - roundIndex - 1) },
          (_, k) => roundIndex + 1 + k,
        ),
      ),
    [rounds],
  );

  return (
    <View>
      {laterRoundsByRound.map((laterRounds, roundIndex) => (
        <RoundCard
          key={roundIndex}
          roundIndex={roundIndex}
          block={block}
          setsByBlockExercise={setsByBlockExercise}
          laterRounds={laterRounds}
          onCardLayout={onCardLayout}
        />
      ))}
    </View>
  );
}
