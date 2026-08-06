import type { AthleteBlockExercise } from "@hooper/api";
import type { BlockExerciseMeasurementRow, ExerciseVideoSource } from "@hooper/db";
import { CheckIcon, ChevronIcon } from "@/src/components/dashboard/icons";
import { BodySm, Caption, H4, Meta, Title } from "@/src/components/ui";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import { colors } from "@/src/constants/theme";
import { getVideoThumbnailUrl } from "@/src/lib/videoThumbnail";
import { useState } from "react";
import { Image, Linking, Pressable, View } from "react-native";

import { NoteIcon, PlayIcon } from "./icons";

export type SetRowState = {
  done: boolean;
  /** Measurement position (0-2, matches block_exercise_measurements.position) -> value. */
  values: Record<number, number>;
};

type ExerciseSetsCardProps = {
  blockExercise: AthleteBlockExercise;
  sets: SetRowState[];
  /** "Round" for a superset block's shared-round exercises, "Set" otherwise. */
  setLabel?: "Set" | "Round";
  onFieldTap: (setIndex: number, position: number) => void;
  onSetDone: (setIndex: number) => void;
};

function VideoThumbnail({
  videoUrl,
  videoSource,
}: {
  videoUrl: string;
  videoSource: ExerciseVideoSource | null;
}) {
  const thumbnailUrl = videoSource === "link" ? getVideoThumbnailUrl(videoUrl) : null;
  return (
    <Pressable
      onPress={() => Linking.openURL(videoUrl)}
      className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
      style={{ backgroundColor: "#16261F" }}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          className="absolute h-16 w-16"
          resizeMode="cover"
        />
      ) : null}
      <View className="h-9 w-9 items-center justify-center rounded-full bg-black/35">
        <PlayIcon size={14} color="#fff" />
      </View>
    </Pressable>
  );
}

function CoachNotes({ notes }: { notes: string }) {
  const [open, setOpen] = useState(true);
  return (
    <View className="mt-2">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center gap-1.5">
        <NoteIcon size={13} color={colors.textTertiary} />
        <Caption>Coach notes</Caption>
        <View style={{ transform: [{ rotate: open ? "-90deg" : "90deg" }] }}>
          <ChevronIcon size={11} color={colors.textTertiary} />
        </View>
      </Pressable>
      {open ? (
        <View className="border-border-subtle mt-2 rounded-lg border bg-white/[0.04] px-3 py-2.5">
          <BodySm>{notes}</BodySm>
        </View>
      ) : null}
    </View>
  );
}

function ExerciseHeader({
  name,
  videoUrl,
  videoSource,
  notes,
  setsLabel,
  doneCount,
  total,
  allDone,
}: {
  name: string;
  videoUrl: string | null;
  videoSource: ExerciseVideoSource | null;
  notes: string | null;
  setsLabel: string;
  doneCount: number;
  total: number;
  allDone: boolean;
}) {
  return (
    <View
      className={`border px-4 py-3 ${allDone ? "border-success/20 bg-success/[0.07]" : "bg-surface-2 border-border-subtle"}`}>
      <View className="flex-row items-start gap-3">
        {videoUrl ? <VideoThumbnail videoUrl={videoUrl} videoSource={videoSource} /> : null}
        <View className="flex-1">
          <Title className={allDone ? "text-text-secondary" : "text-text-primary"}>
            {name}
          </Title>
          <Meta className="mt-0.5">{setsLabel}</Meta>
        </View>
        <View className="flex-row items-baseline">
          <H4 style={{ color: allDone ? colors.success : colors.brandOrange }}>{doneCount}</H4>
          <Caption>/{total}</Caption>
        </View>
      </View>
      {notes ? <CoachNotes notes={notes} /> : null}
    </View>
  );
}

function SetRow({
  set,
  measurements,
  onFieldTap,
  onSetDone,
}: {
  set: SetRowState;
  measurements: BlockExerciseMeasurementRow[];
  onFieldTap: (position: number) => void;
  onSetDone: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      {measurements.map((m) => (
        <Pressable
          key={m.position}
          disabled={set.done}
          onPress={() => onFieldTap(m.position)}
          className="flex-1 rounded-lg border px-3 py-2"
          style={{
            backgroundColor: set.done ? "rgba(56,161,105,0.06)" : "rgba(255,255,255,0.04)",
            borderColor: set.done ? "rgba(56,161,105,0.14)" : colors.borderSubtle,
          }}>
          <Meta className="uppercase">{m.unit_type}</Meta>
          <Title className={set.done ? "text-success/85" : "text-text-primary"}>
            {set.values[m.position] ?? "—"}
          </Title>
        </Pressable>
      ))}

      <Pressable
        onPress={onSetDone}
        className="h-10 w-10 items-center justify-center rounded-full border"
        style={{
          backgroundColor: set.done ? "rgba(56,161,105,0.12)" : "rgba(241,88,37,0.1)",
          borderColor: set.done ? "rgba(56,161,105,0.3)" : "rgba(241,88,37,0.28)",
        }}>
        <CheckIcon size={16} color={set.done ? colors.success : colors.brandOrange} />
      </Pressable>
    </View>
  );
}

export function ExerciseSetsCard({
  blockExercise,
  sets,
  setLabel = "Set",
  onFieldTap,
  onSetDone,
}: ExerciseSetsCardProps) {
  const { exercise, measurements, notes } = blockExercise;
  const doneCount = sets.filter((s) => s.done).length;
  const allDone = doneCount === sets.length && sets.length > 0;

  const measurementsBySet = new Map<number, BlockExerciseMeasurementRow[]>();
  for (const m of measurements) {
    const list = measurementsBySet.get(m.set_index) ?? [];
    list.push(m);
    measurementsBySet.set(m.set_index, list);
  }

  const setsLabel = `${sets.length} ${setLabel.toLowerCase()}${sets.length === 1 ? "" : "s"}`;

  return (
    <View className="mb-3 overflow-hidden rounded-2xl">
      <ExerciseHeader
        name={exercise.name}
        videoUrl={exercise.video_url}
        videoSource={exercise.video_source}
        notes={notes}
        setsLabel={setsLabel}
        doneCount={doneCount}
        total={sets.length}
        allDone={allDone}
      />
      <View className="bg-surface-2 border-border-subtle gap-2 border border-t-0 px-4 py-3">
        {sets.map((set, setIndex) => (
          <SetRow
            key={setIndex}
            set={set}
            measurements={sortByUnitTypePriority(measurementsBySet.get(setIndex) ?? [])}
            onFieldTap={(position) => onFieldTap(setIndex, position)}
            onSetDone={() => onSetDone(setIndex)}
          />
        ))}
      </View>
    </View>
  );
}
