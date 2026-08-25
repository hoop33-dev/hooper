import { CheckIcon, ChevronIcon } from "@/src/components/dashboard/icons";
import { BodySm, Caption, H4, Meta, Title } from "@/src/components/ui";
import { colors, easing } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import {
  groupSetsByVariant,
  resolveGroupStyle,
  resolveSetStyle,
} from "@/src/lib/blockExerciseDisplay";
import { getVideoThumbnailUrl } from "@/src/lib/videoThumbnail";
import type { AthleteBlockExercise } from "@hooper/api";
import type {
  BlockExerciseMeasurementRow,
  ExerciseVideoOrientation,
  ExerciseVideoSource,
} from "@hooper/db";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { NoteIcon, PlayIcon } from "./icons";
import { VideoPlayerModal } from "./videoPlayer/VideoPlayerModal";

/** Drives the shared 0..1 progress behind every "done" fill animation below
 * — the same withTiming call runs toward 0 or 1 depending on `done`, so
 * un-ticking a set reverses the exact animation for free, not a special
 * case. Explicit ease-out (rather than withTiming's default ease-in-out)
 * because ease-in-out has near-zero velocity for the first ~20% of the
 * duration — on a short ~240ms fill that reads as a lag before the tap
 * does anything, rather than an instant response that eases to a stop. */
function useDoneProgress(done: boolean) {
  const progress = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(done ? 1 : 0, {
      duration: easing.base,
      easing: Easing.out(Easing.quad),
    });
  }, [done, progress]);
  return progress;
}

export type SetRowState = {
  done: boolean;
  /** Measurement position (0-2, matches block_exercise_measurements.position) -> value. */
  values: Record<number, number>;
};

type ExerciseSetsCardProps = {
  blockExercise: AthleteBlockExercise;
  sets: SetRowState[];
  onValueChange: (setIndex: number, position: number, value: number) => void;
  onSetDone: (setIndex: number) => void;
};

export function VideoThumbnail({
  videoUrl,
  videoSource,
  videoOrientation,
  videoThumbnailUrl,
  title,
}: {
  videoUrl: string;
  videoSource: ExerciseVideoSource | null;
  videoOrientation: ExerciseVideoOrientation | null;
  /** Captured client-side at upload time (apps/web/src/lib/videoThumbnailCapture.ts)
   * — only ever set for "upload" videos. YouTube links derive their
   * thumbnail from the URL instead (getVideoThumbnailUrl below). */
  videoThumbnailUrl: string | null;
  title: string;
}) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const thumbnailUrl =
    videoSource === "link" ? getVideoThumbnailUrl(videoUrl) : videoThumbnailUrl;
  return (
    <>
      <Pressable
        onPress={() => setPlayerOpen(true)}
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
      <VideoPlayerModal
        visible={playerOpen}
        onClose={() => setPlayerOpen(false)}
        videoUrl={videoUrl}
        videoSource={videoSource ?? "upload"}
        videoOrientation={videoOrientation}
        title={title}
      />
    </>
  );
}

function CoachNotes({ notes }: { notes: string }) {
  const [open, setOpen] = useState(true);
  return (
    <View className="mt-2">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center gap-1.5">
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
  videoOrientation,
  videoThumbnailUrl,
  notes,
  setsLabel,
  doneCount,
  total,
  allDone,
}: {
  name: string;
  videoUrl: string | null;
  videoSource: ExerciseVideoSource | null;
  videoOrientation: ExerciseVideoOrientation | null;
  videoThumbnailUrl: string | null;
  notes: string | null;
  /** Only set when the whole group shares one style — e.g. "Warmup · 4
   * sets". There's no plain "4 sets" fallback; per-set style subheadings
   * (or nothing at all) cover the rest. */
  setsLabel: string | null;
  doneCount: number;
  total: number;
  allDone: boolean;
}) {
  return (
    <View
      className={`border px-4 py-3 ${allDone ? "border-success/20 bg-success/[0.07]" : "bg-surface-2 border-border-subtle"}`}>
      <View className="flex-row items-start gap-3">
        {videoUrl ? (
          <VideoThumbnail
            videoUrl={videoUrl}
            videoSource={videoSource}
            videoOrientation={videoOrientation}
            videoThumbnailUrl={videoThumbnailUrl}
            title={name}
          />
        ) : null}
        <View className="flex-1">
          <Title
            className={allDone ? "text-text-secondary" : "text-text-primary"}>
            {name}
          </Title>
          {setsLabel ? <Meta className="mt-0.5">{setsLabel}</Meta> : null}
        </View>
        <View className="flex-row items-baseline">
          <H4 style={{ color: allDone ? colors.success : colors.brandOrange }}>
            {doneCount}
          </H4>
          <Caption>/{total}</Caption>
        </View>
      </View>
      {notes ? <CoachNotes notes={notes} /> : null}
    </View>
  );
}

/** The green "done" fill for a value box — wipes in from the left as the
 * set is ticked, and back out (reversed) when un-ticked. */
function GreenWipeFill({ done }: { done: boolean }) {
  const progress = useDoneProgress(done);
  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-0 rounded-lg"
      style={[{ backgroundColor: "rgba(56,161,105,0.06)" }, style]}
    />
  );
}

/** A single measurement's value box — tapping anywhere in it (not just the
 * digits) focuses the embedded TextInput, opening the keyboard right there
 * for direct in-place editing. Replaced a tap-to-open bottom-sheet modal:
 * the value now commits on blur instead of a separate "Done" confirmation. */
export function FieldBox({
  unitType,
  value,
  done,
  onChange,
}: {
  unitType: string;
  value: number | undefined;
  done: boolean;
  onChange: (value: number) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState(value !== undefined ? String(value) : "");

  useEffect(() => {
    setText(value !== undefined ? String(value) : "");
  }, [value]);

  function commit() {
    const numeric = Number(text);
    if (text.trim() !== "" && Number.isFinite(numeric) && numeric >= 0) {
      if (numeric !== value) onChange(numeric);
    } else {
      setText(value !== undefined ? String(value) : "");
    }
  }

  return (
    <Pressable
      disabled={done}
      onPress={() => inputRef.current?.focus()}
      className="flex-1 overflow-hidden rounded-lg border px-3 py-2"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: colors.borderSubtle,
      }}>
      <GreenWipeFill done={done} />
      <Meta
        className="uppercase"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {unitType}
      </Meta>
      <TextInput
        ref={inputRef}
        editable={!done}
        value={text}
        onChangeText={(v) => setText(v.replace(/[^0-9.]/g, ""))}
        onBlur={commit}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textDisabled}
        selectTextOnFocus
        style={{
          fontFamily: "BarlowCondensed-ExtraBold",
          fontSize: 20,
          lineHeight: 20 * 1.15,
          letterSpacing: 20 * 0.02,
          color: done ? "rgba(56,161,105,0.85)" : colors.textPrimary,
          padding: 0,
        }}
      />
    </Pressable>
  );
}

/** The green "done" fill for the tick button — grows from the button's own
 * center to fill it, since scaling a same-size circular layer inside a
 * circular parent reads as "growing outward" with no origin math needed. */
function GreenCircleFill({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-0 rounded-full"
      style={[{ backgroundColor: "rgba(56,161,105,0.12)" }, style]}
    />
  );
}

/** The round tick button — stretches to the row's full height and adds a
 * bit of horizontal padding around the circle, so the tappable area is the
 * whole right-hand column, not just the 40px circle itself (which was easy
 * for a thumb to miss by a few pixels and land on nothing). The check icon
 * itself still snaps color instantly (not crossfaded) — trimmed to cut back
 * the number of always-mounted animated views, since every block's exercise
 * list stays mounted for the whole session (the pager isn't virtualized),
 * so per-row animation cost multiplies across the entire workout. */
export function SetDoneButton({
  done,
  onPress,
}: {
  done: boolean;
  onPress: () => void;
}) {
  const progress = useDoneProgress(done);
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center px-2"
      style={{ alignSelf: "stretch" }}>
      <View
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border"
        style={{
          backgroundColor: "rgba(241,88,37,0.1)",
          borderColor: "rgba(241,88,37,0.28)",
        }}>
        <GreenCircleFill progress={progress} />
        <CheckIcon
          size={16}
          color={done ? colors.success : colors.brandOrange}
        />
      </View>
    </Pressable>
  );
}

function SetRow({
  set,
  measurements,
  styleName,
  onValueChange,
  onSetDone,
}: {
  set: SetRowState;
  measurements: BlockExerciseMeasurementRow[];
  /** This set's own style, shown as a small subheading above the row —
   * only passed when the group's sets don't all share one style (see
   * resolveGroupStyle's `uniform`), since that case is already named once
   * on the exercise header instead. */
  styleName?: string | null;
  onValueChange: (position: number, value: number) => void;
  onSetDone: () => void;
}) {
  return (
    <View>
      {styleName ? <Meta className="mb-1">{styleName}</Meta> : null}
      <View className="flex-row items-center gap-2">
        {measurements.map((m) => (
          <FieldBox
            key={m.position}
            unitType={m.unit_type}
            value={set.values[m.position]}
            done={set.done}
            onChange={(value) => onValueChange(m.position, value)}
          />
        ))}

        <SetDoneButton done={set.done} onPress={onSetDone} />
      </View>
    </View>
  );
}

export function ExerciseSetsCard({
  blockExercise,
  sets,
  onValueChange,
  onSetDone,
}: ExerciseSetsCardProps) {
  const { measurements, notes } = blockExercise;

  const measurementsBySet = new Map<number, BlockExerciseMeasurementRow[]>();
  for (const m of measurements) {
    const list = measurementsBySet.get(m.set_index) ?? [];
    list.push(m);
    measurementsBySet.set(m.set_index, list);
  }

  const groups = groupSetsByVariant(blockExercise);

  return (
    <>
      {groups.map((group, groupIndex) => {
        const groupSets = group.setIndices
          .map((setIndex) => sets[setIndex])
          .filter(Boolean);
        const doneCount = groupSets.filter((s) => s.done).length;
        const allDone = doneCount === groupSets.length && groupSets.length > 0;
        const groupStyle = resolveGroupStyle(blockExercise, group.setIndices);
        // A style that applies to every set in the group (not just the most
        // common) is named once, under the exercise name, in place of a
        // sets count — there's no plain sets-count line otherwise. A style
        // that only wins a plurality among a mix is instead shown per-row
        // (see styleName below) since one name can't represent the whole
        // group.
        const setsLabel = groupStyle?.uniform ? groupStyle.name : null;
        const showPerSetStyle = !!groupStyle && !groupStyle.uniform;

        return (
          <View
            key={group.exercise.id + groupIndex}
            className="mb-3 overflow-hidden rounded-2xl">
            <ExerciseHeader
              name={group.exercise.name}
              videoUrl={group.exercise.video_url}
              videoSource={group.exercise.video_source}
              videoOrientation={group.exercise.video_orientation}
              videoThumbnailUrl={group.exercise.video_thumbnail_url}
              notes={groupIndex === 0 ? notes : null}
              setsLabel={setsLabel}
              doneCount={doneCount}
              total={groupSets.length}
              allDone={allDone}
            />
            <View className="bg-surface-2 border-border-subtle gap-2 border border-t-0 px-4 py-3">
              {group.setIndices.map((setIndex) => {
                const set = sets[setIndex];
                if (!set) return null;
                return (
                  <SetRow
                    key={setIndex}
                    set={set}
                    measurements={sortByUnitTypePriority(
                      measurementsBySet.get(setIndex) ?? [],
                    )}
                    styleName={
                      showPerSetStyle
                        ? resolveSetStyle(blockExercise, setIndex)?.name
                        : null
                    }
                    onValueChange={(position, value) =>
                      onValueChange(setIndex, position, value)
                    }
                    onSetDone={() => onSetDone(setIndex)}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}
