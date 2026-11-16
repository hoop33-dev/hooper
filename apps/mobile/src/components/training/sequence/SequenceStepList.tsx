import { Meta, MicroLabel } from "@/src/components/ui";
import { bodyFont, colors } from "@/src/constants/theme";
import { exerciseMediaItems } from "@/src/lib/exerciseMedia";
import type { SequenceSetStep } from "@/src/lib/sequenceDisplay";
import type { AthleteExercise } from "@hooper/api";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ExerciseMediaThumbnail } from "../ExerciseMediaThumbnail";
import { ExerciseMediaViewer } from "../videoPlayer/ExerciseMediaViewer";

const BADGE = 22;

function StepBadge({ n, changed }: { n: number; changed: boolean }) {
  return (
    <View
      style={{
        width: BADGE,
        height: BADGE,
        borderRadius: BADGE / 2,
        zIndex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: changed ? colors.brandOrange : colors.surface3,
      }}>
      <Text
        style={{ fontFamily: bodyFont("700"), fontSize: 10.5, color: "#fff" }}>
        {n}
      </Text>
    </View>
  );
}

type OpenMedia = (exercise: AthleteExercise, startIndex: number) => void;

/** The step's media tile, or a blank tile when the exercise has none (or
 * the step is empty) so the names stay aligned. */
function StepThumb({
  step,
  size,
  onOpen,
}: {
  step: SequenceSetStep;
  size: number;
  onOpen: OpenMedia;
}) {
  const exercise = step.exercise;
  const media = useMemo(
    () => (exercise ? exerciseMediaItems(exercise) : []),
    [exercise],
  );
  if (!exercise || media.length === 0) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: colors.surface3,
        }}
      />
    );
  }
  return (
    <ExerciseMediaThumbnail
      items={media}
      onOpen={(index) => onOpen(exercise, index)}
      size={size}
    />
  );
}

function StepRow({
  step,
  n,
  last,
  compact,
  onOpenMedia,
}: {
  step: SequenceSetStep;
  n: number;
  last: boolean;
  compact: boolean;
  onOpenMedia: OpenMedia;
}) {
  return (
    <View
      className="flex-row items-center gap-2.5"
      style={{ paddingVertical: compact ? 4 : 6 }}>
      {last ? null : (
        <View
          style={{
            position: "absolute",
            left: BADGE / 2 - 1,
            top: "50%",
            height: "100%",
            width: 2,
            backgroundColor: colors.borderSubtle,
          }}
        />
      )}
      <StepBadge n={n} changed={step.changed} />
      <StepThumb step={step} size={compact ? 34 : 40} onOpen={onOpenMedia} />
      <View className="min-w-0 flex-1">
        <MicroLabel className="uppercase" numberOfLines={1}>
          {step.step.label}
        </MicroLabel>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: bodyFont("600"),
            fontSize: compact ? 13.5 : 14.5,
            color: colors.textPrimary,
          }}>
          {step.exercise?.name ?? "—"}
        </Text>
        {step.changed && step.previous ? (
          <Meta className="mt-px">
            Was{" "}
            <Text style={{ textDecorationLine: "line-through" }}>
              {step.previous.name}
            </Text>
          </Meta>
        ) : null}
      </View>
    </View>
  );
}

/** A sequence's steps on one set, top to bottom, joined by a rail. Steps
 * this set swaps are marked in orange with what they replaced. One media
 * viewer serves every step, showing whichever tile was tapped. */
export function SequenceStepList({
  steps,
  compact = false,
}: {
  steps: SequenceSetStep[];
  compact?: boolean;
}) {
  const [viewing, setViewing] = useState<{
    exercise: AthleteExercise;
    startIndex: number;
  } | null>(null);
  const viewingExercise = viewing?.exercise;
  const media = useMemo(
    () => (viewingExercise ? exerciseMediaItems(viewingExercise) : []),
    [viewingExercise],
  );
  return (
    <View>
      {steps.map((s, i) => (
        <StepRow
          key={s.step.id}
          step={s}
          n={i + 1}
          last={i === steps.length - 1}
          compact={compact}
          onOpenMedia={(exercise, startIndex) =>
            setViewing({ exercise, startIndex })
          }
        />
      ))}
      <ExerciseMediaViewer
        startIndex={viewing?.startIndex ?? null}
        onClose={() => setViewing(null)}
        items={media}
        title={viewingExercise?.name ?? ""}
        cue={viewingExercise?.description ?? null}
      />
    </View>
  );
}
