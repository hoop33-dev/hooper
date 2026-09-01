import { ChevronIcon } from "@/src/components/dashboard/icons";
import { BodySm, Caption, H4, Meta, Title } from "@/src/components/ui";
import { colors, radii } from "@/src/constants/theme";
import { sortByUnitTypePriority } from "@/src/constants/unitTypes";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";
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
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import { NoteIcon, PlayIcon } from "./icons";
import { VideoPlayerModal } from "./videoPlayer/VideoPlayerModal";

const EASE_OUT = Easing.out(Easing.cubic);

// Row (Part 1 baseline) — always plays, with or without reduced motion.
const FIELD_TEXT_FADE_DURATION = 260;
const ROW_FADE_DURATION = 280;
const ROW_FADE_OPACITY = 0.5;

// Field flash (Part 1 effect layer) — dropped under reduced motion.
const FLASH_DURATION = 340;
const FLASH_STAGGER = 70;
const FLASH_BG = "rgba(56,161,105,0.22)";
const FLASH_BORDER = "rgba(56,161,105,0.55)";
const FIELD_RADIUS = 8;

// Done control (Part 2) — dropped under reduced motion.
const DONE_SIZE = 38;
const DISC_STEP1_DURATION = 79; // 18% of 440ms
const DISC_STEP2_DURATION = 150; // 52% - 18% of 440ms
const DISC_STEP3_DURATION = 211; // 100% - 52% of 440ms

const TICK_VIEWBOX = 16;
const TICK_PATH = "M13.333 4L6 11.333L2.667 8";
const TICK_PATH_LENGTH = 15.08;
const TICK_SCALE_DELAY = 240;
const TICK_SCALE_DURATION = 260;
const TICK_STROKE_DELAY = 280;
const TICK_STROKE_DURATION = 240;
const TICK_OPACITY_DURATION = TICK_SCALE_DURATION * 0.6;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Absolutely-positioned green pulse over a field, staggered by its index in
 * the row (Part 1 — "field settle"). Non-interactive, dropped under reduced
 * motion (the field's own 260ms colour transition still plays). */
function FieldFlash({ done, index }: { done: boolean; index: number }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current && !reducedMotion) {
      opacity.value = withSequence(
        withDelay(index * FLASH_STAGGER, withTiming(1, { duration: 0 })),
        withTiming(0, { duration: FLASH_DURATION, easing: EASE_OUT }),
      );
    }
    prevDone.current = done;
  }, [done, index, reducedMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: FIELD_RADIUS,
          borderWidth: 1,
          backgroundColor: FLASH_BG,
          borderColor: FLASH_BORDER,
        },
        style,
      ]}
    />
  );
}

/** The flex-row holding a set's fields + done button — eases to 50% opacity
 * over 280ms when the set completes, instead of snapping. Always plays
 * (reduced motion or not) since this alone is what settles the row into its
 * correct completed look. Shared by plain exercises and supersets. */
export function SetFieldRow({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(done ? ROW_FADE_OPACITY : 1);

  useEffect(() => {
    opacity.value = withTiming(done ? ROW_FADE_OPACITY : 1, {
      duration: ROW_FADE_DURATION,
      easing: EASE_OUT,
    });
  }, [done, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View className="flex-row items-center gap-2" style={style}>
      {children}
    </Animated.View>
  );
}

/** The green disc behind the done-button's tick (Part 2 — "dot-to-tick
 * flip"): snaps in small, expands to fill the circle, holds, then fades out
 * in place. Dropped under reduced motion. */
function DoneDisc({ done }: { done: boolean }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current && !reducedMotion) {
      scale.value = 0.18;
      opacity.value = 0;
      scale.value = withSequence(
        withTiming(0.3, { duration: DISC_STEP1_DURATION, easing: EASE_OUT }),
        withTiming(1, { duration: DISC_STEP2_DURATION, easing: EASE_OUT }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: DISC_STEP1_DURATION, easing: EASE_OUT }),
        withDelay(
          DISC_STEP2_DURATION,
          withTiming(0, { duration: DISC_STEP3_DURATION, easing: EASE_OUT }),
        ),
      );
    }
    prevDone.current = done;
  }, [done, reducedMotion, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: DONE_SIZE,
          height: DONE_SIZE,
          borderRadius: radii.full,
          backgroundColor: colors.success,
        },
        style,
      ]}
    />
  );
}

/** The done-button's check mark: always fully drawn at rest (orange before
 * completion, green after), but on the false→true flip it re-draws itself
 * under a scale pop — the "confirmation stamp" moment that lands as the
 * disc behind it fades out. Dropped under reduced motion, in which case it
 * just appears at its resting state instantly. Kept separate from the
 * shared CheckIcon (used elsewhere with no animation). */
function AnimatedCheckTick({
  done,
  size,
  color,
}: {
  done: boolean;
  size: number;
  color: string;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const strokeOffset = useSharedValue(0);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current && !reducedMotion) {
      scale.value = 0.35;
      opacity.value = 0;
      strokeOffset.value = TICK_PATH_LENGTH;
      scale.value = withDelay(
        TICK_SCALE_DELAY,
        withSequence(
          withTiming(1.12, {
            duration: TICK_SCALE_DURATION * 0.6,
            easing: EASE_OUT,
          }),
          withTiming(1, {
            duration: TICK_SCALE_DURATION * 0.4,
            easing: EASE_OUT,
          }),
        ),
      );
      opacity.value = withDelay(
        TICK_SCALE_DELAY,
        withTiming(1, { duration: TICK_OPACITY_DURATION, easing: EASE_OUT }),
      );
      strokeOffset.value = withDelay(
        TICK_STROKE_DELAY,
        withTiming(0, { duration: TICK_STROKE_DURATION, easing: EASE_OUT }),
      );
    }
    prevDone.current = done;
  }, [done, reducedMotion, scale, opacity, strokeOffset]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  return (
    <Animated.View style={containerStyle}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${TICK_VIEWBOX} ${TICK_VIEWBOX}`}
        fill="none">
        <AnimatedPath
          d={TICK_PATH}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[TICK_PATH_LENGTH, TICK_PATH_LENGTH]}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
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
  faded,
}: {
  videoUrl: string;
  videoSource: ExerciseVideoSource | null;
  videoOrientation: ExerciseVideoOrientation | null;
  /** Captured client-side at upload time (apps/web/src/lib/videoThumbnailCapture.ts)
   * — only ever set for "upload" videos. YouTube links derive their
   * thumbnail from the URL instead (getVideoThumbnailUrl below). */
  videoThumbnailUrl: string | null;
  title: string;
  faded?: boolean;
}) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const thumbnailUrl =
    videoSource === "link" ? getVideoThumbnailUrl(videoUrl) : videoThumbnailUrl;
  return (
    <>
      <Pressable
        onPress={() => setPlayerOpen(true)}
        className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: "#16261F", opacity: faded ? 0.4 : 1 }}>
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
    <View className="bg-surface-2 border-border-subtle border px-4 py-3">
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
          <H4
            style={{
              color: allDone ? colors.textSecondary : colors.brandOrange,
            }}>
            {doneCount}
          </H4>
          <Caption>/{total}</Caption>
        </View>
      </View>
      {notes ? <CoachNotes notes={notes} /> : null}
    </View>
  );
}

/** A single measurement's value box — tapping anywhere in it (not just the
 * digits) focuses the embedded TextInput, opening the keyboard right there
 * for direct in-place editing. Replaced a tap-to-open bottom-sheet modal:
 * the value now commits on blur instead of a separate "Done" confirmation. */
// The value colour cross-fades to its dimmer completed shade over 260ms —
// always plays, reduced motion or not (see FieldFlash for the effect layer
// on top of this baseline transition).
function useFieldTextStyle(done: boolean) {
  const textFade = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    textFade.value = withTiming(done ? 1 : 0, {
      duration: FIELD_TEXT_FADE_DURATION,
      easing: EASE_OUT,
    });
  }, [done, textFade]);
  return useAnimatedStyle(() => ({
    color: interpolateColor(
      textFade.value,
      [0, 1],
      [colors.textPrimary, colors.textSecondary],
    ),
  }));
}

export function FieldBox({
  unitType,
  value,
  done,
  index,
  onChange,
}: {
  unitType: string;
  value: number | undefined;
  done: boolean;
  /** This field's position in the row (0-2) — staggers its completion flash
   * by `index * 70ms` so the motion reads left-to-right across the row. */
  index: number;
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

  const textStyle = useFieldTextStyle(done);

  return (
    <Pressable
      disabled={done}
      onPress={() => inputRef.current?.focus()}
      className="flex-1 rounded-lg border px-3 py-2"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: colors.borderSubtle,
      }}>
      <Meta
        className="uppercase"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {unitType}
      </Meta>
      <AnimatedTextInput
        ref={inputRef}
        editable={!done}
        value={text}
        onChangeText={(v) => setText(v.replace(/[^0-9.]/g, ""))}
        onBlur={commit}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textDisabled}
        selectTextOnFocus
        style={[
          {
            fontFamily: "BarlowCondensed-ExtraBold",
            fontSize: 20,
            lineHeight: 20 * 1.15,
            letterSpacing: 20 * 0.02,
            padding: 0,
          },
          textStyle,
        ]}
      />
      <FieldFlash done={done} index={index} />
    </Pressable>
  );
}

/** The round tick button — stretches to the row's full height and adds a
 * bit of horizontal padding around the circle, so the tappable area is the
 * whole right-hand column, not just the 38px circle itself (which was easy
 * for a thumb to miss by a few pixels and land on nothing). Once done, the
 * orange fill/border drop away and it's a bare green tick — the "dot-to-tick
 * flip" (DoneDisc + AnimatedCheckTick) plays behind/on it as the confirmation
 * moment. */
export function SetDoneButton({
  done,
  onPress,
}: {
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center px-2"
      style={{ alignSelf: "stretch" }}>
      <View
        style={{
          width: DONE_SIZE,
          height: DONE_SIZE,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.full,
          // Toggle the border/fill values rather than adding/removing these
          // style keys entirely — swapping the whole object in and out (as
          // opposed to changing values on stable keys) is what caused the
          // native view to occasionally lose its corner radius and render
          // square after a done → undone → done cycle.
          borderWidth: done ? 0 : 1.5,
          backgroundColor: done ? "transparent" : "rgba(241,88,37,0.1)",
          borderColor: done ? "transparent" : "rgba(241,88,37,0.28)",
        }}>
        <DoneDisc done={done} />
        <AnimatedCheckTick
          done={done}
          size={12}
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
      <SetFieldRow done={set.done}>
        {measurements.map((m, i) => (
          <FieldBox
            key={m.position}
            index={i}
            unitType={m.unit_type}
            value={set.values[m.position]}
            done={set.done}
            onChange={(value) => onValueChange(m.position, value)}
          />
        ))}

        <SetDoneButton done={set.done} onPress={onSetDone} />
      </SetFieldRow>
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
            className="mb-3 overflow-hidden rounded-2xl"
            style={{ opacity: allDone ? 0.8 : 1 }}>
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
