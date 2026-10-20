import { ChevronIcon, XIcon } from "@/src/components/dashboard/icons";
import { BodySm, H3, Meta, Overline, TabLabel } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import type {
  ExerciseMediaItem,
  ExerciseMediaVideo,
} from "@/src/lib/exerciseMedia";
import { mediaPreviewUrl } from "@/src/lib/exerciseMedia";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { PlayIcon } from "../icons";
import { DoubleTapSeekOverlay } from "./DoubleTapSeekOverlay";
import { formatTime, VideoPlayButton, VideoScrubRow } from "./PlayerControls";
import { usePlayerControls } from "./usePlayerControls";
import { VideoSurface } from "./VideoSurface";

const STRIP_TILE = 46;
const STRIP_VIDEO_TILE = 64;
const STRIP_GAP = 8;

type ExerciseMediaViewerProps = {
  /** Null while closed. */
  startIndex: number | null;
  onClose: () => void;
  items: ExerciseMediaItem[];
  title: string;
  /** The exercise's coaching cue, shown under the demo video. */
  cue: string | null;
};

type Size = { width: number; height: number };

/** Header position segments — orange for the current item, dark grey for
 * the rest. */
function ProgressBars({ count, index }: { count: number; index: number }) {
  return (
    <View className="flex-row" style={{ gap: 4 }}>
      {Array.from({ length: count }, (_, k) => (
        <View
          key={k}
          className="flex-1 rounded-sm"
          style={{
            height: 3,
            backgroundColor:
              k === index ? colors.brandOrange : "rgba(255,255,255,0.18)",
          }}
        />
      ))}
    </View>
  );
}

function RoundButton({
  onPress,
  label,
  size,
  children,
  style,
}: {
  onPress: () => void;
  label: string;
  size: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center justify-center rounded-full"
      style={[
        {
          width: size,
          height: size,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

function PhotoPage({ uri, size }: { uri: string; size: Size }) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={size} className="items-center justify-center">
      <Image
        source={{ uri }}
        style={size}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <ActivityIndicator
          color={colors.textTertiary}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

/** The panel text for one item — eyebrow, title, and (video) scrubber and
 * cue. Rendered once for real and once per item in a hidden measuring
 * layer, so the panel can hold the tallest item's height and the media area
 * above it never resizes mid-swipe. */
function PanelText({
  item,
  photoCount,
  title,
  cue,
  videoDuration,
  scrubRow,
}: {
  item: ExerciseMediaItem;
  photoCount: number;
  title: string;
  cue: string | null;
  videoDuration: number;
  scrubRow: ReactNode;
}) {
  const isVideo = item.kind === "video";
  return (
    <View>
      <Overline>
        {isVideo
          ? videoDuration > 0
            ? `Demo video · ${formatTime(videoDuration)}`
            : "Demo video"
          : `Photo ${item.n} of ${photoCount}`}
      </Overline>
      <H3 className="mt-1.5" numberOfLines={2}>
        {isVideo ? title : item.caption}
      </H3>
      {isVideo && item.source === "upload" ? (
        <View className="mt-2.5">{scrubRow}</View>
      ) : null}
      {isVideo && cue ? (
        <BodySm className="mt-2" numberOfLines={3}>
          {cue}
        </BodySm>
      ) : null}
    </View>
  );
}

function MediaStrip({
  items,
  index,
  onSelect,
}: {
  items: ExerciseMediaItem[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const tileWidth = (m: ExerciseMediaItem) =>
    m.kind === "video" ? STRIP_VIDEO_TILE : STRIP_TILE;

  // Keep the active tile in view (centred where the strip can scroll).
  useEffect(() => {
    if (!width) return;
    let x = 0;
    for (let k = 0; k < index; k++) x += tileWidth(items[k]!) + STRIP_GAP;
    const target = x - (width - tileWidth(items[index]!)) / 2;
    ref.current?.scrollTo({ x: Math.max(0, target), animated: true });
  }, [index, width, items]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      contentContainerStyle={{ gap: STRIP_GAP, paddingHorizontal: 20 }}
      // Outlines are drawn with a 3px inset ring, so leave room for them.
      style={{ flexGrow: 0, paddingVertical: 3 }}>
      {items.map((m, k) => {
        const uri = mediaPreviewUrl(m);
        const active = k === index;
        return (
          <Pressable
            key={m.key}
            onPress={() => onSelect(k)}
            accessibilityRole="button"
            accessibilityLabel={
              m.kind === "video" ? "Demo video" : `Photo ${m.n}`
            }
            className="items-center justify-center overflow-hidden rounded-lg"
            style={{
              width: tileWidth(m),
              height: STRIP_TILE,
              backgroundColor: colors.surface2,
              borderWidth: 2,
              borderColor: active ? colors.brandOrange : "transparent",
              opacity: active ? 1 : 0.6,
            }}>
            {uri ? (
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
            {m.kind === "video" ? (
              <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-black/60">
                <PlayIcon size={8} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Index + horizontal-pager wiring. The index follows the live scroll
 * offset (whichever page is mostly on screen), so the header bars and strip
 * stay in step however fast you swipe — a flag set on drag-begin and
 * cleared on momentum-end goes stale when a second swipe interrupts the
 * first. The one exception is a programmatic scrollTo (chevron/strip tap):
 * while it animates toward `pendingTarget` the offsets it passes through are
 * ignored, so rapid taps never flash or bounce back to an in-between page.
 * A finger drag cancels the pending target and takes over. */
function useMediaPager(count: number, startIndex: number) {
  const [initialIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), count - 1),
  );
  const [index, setIndex] = useState(initialIndex);
  const [size, setSize] = useState<Size | null>(null);
  const ref = useRef<ScrollView>(null);
  const pendingTarget = useRef<number | null>(null);
  const clamp = (i: number) => Math.min(Math.max(0, i), count - 1);

  const goTo = (next: number) => {
    const target = clamp(next);
    setIndex(target);
    if (!size) return;
    pendingTarget.current = target;
    ref.current?.scrollTo({ x: target * size.width, animated: true });
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setSize({ width, height });
  };

  const syncToOffset = (x: number) => {
    if (!size) return;
    const page = clamp(Math.round(x / size.width));
    if (pendingTarget.current !== null) {
      // Still animating toward a tapped page — only release once there.
      if (Math.abs(x - pendingTarget.current * size.width) > 1) return;
      pendingTarget.current = null;
    }
    setIndex(page);
  };

  const scrollProps = {
    ref,
    // Initial page only — later moves go through goTo or the user's swipe.
    contentOffset: { x: initialIndex * (size?.width ?? 0), y: 0 },
    scrollEventThrottle: 16,
    onScrollBeginDrag: () => {
      pendingTarget.current = null;
    },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      syncToOffset(e.nativeEvent.contentOffset.x),
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      syncToOffset(e.nativeEvent.contentOffset.x),
  };

  return { index, goTo, size, onLayout, scrollProps };
}

function ViewerHeader({
  title,
  index,
  count,
  onClose,
}: {
  title: string;
  index: number;
  count: number;
  onClose: () => void;
}) {
  return (
    <View className="gap-3 px-4 pt-2 pb-3">
      {count > 1 ? <ProgressBars count={count} index={index} /> : null}
      <View className="flex-row items-center gap-2.5">
        <TabLabel className="flex-1" numberOfLines={1}>
          {title}
        </TabLabel>
        <Meta className="text-text-secondary">
          {index + 1} / {count}
        </Meta>
        <RoundButton
          onPress={onClose}
          label="Close"
          size={34}
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <XIcon size={15} color="#fff" />
        </RoundButton>
      </View>
    </View>
  );
}

type VideoControls = ReturnType<typeof usePlayerControls>;

function VideoPage({
  item,
  size,
  controls,
}: {
  item: ExerciseMediaVideo;
  size: Size;
  controls: VideoControls;
}) {
  return (
    <View style={size}>
      <VideoSurface
        ref={controls.engineRef}
        videoUrl={item.url}
        videoSource={item.source}
        containerWidth={size.width}
        containerHeight={size.height}
        onStateChange={controls.setEngineState}
      />
      {item.source === "upload" ? (
        <>
          {/* Above the native VideoView, which swallows taps itself — see
           * DoubleTapSeekOverlay. A horizontal drag cancels the tap, so it
           * doesn't fight paging. */}
          <DoubleTapSeekOverlay
            onSkip={controls.handleSkip}
            onSingleTap={controls.handlePlayPause}
          />
          <VideoPlayButton
            isPlaying={controls.engineState.isPlaying}
            onPress={controls.handlePlayPause}
          />
        </>
      ) : null}
    </View>
  );
}

/** Prev/next — also the only way off a YouTube page, whose WebView keeps
 * horizontal pans for itself. */
function Chevrons({
  index,
  count,
  goTo,
}: {
  index: number;
  count: number;
  goTo: (index: number) => void;
}) {
  return (
    <>
      {index > 0 ? (
        <RoundButton
          onPress={() => goTo(index - 1)}
          label="Previous"
          size={36}
          style={[styles.chevron, { left: 10 }]}>
          <View style={{ transform: [{ rotate: "180deg" }] }}>
            <ChevronIcon size={18} color="#fff" />
          </View>
        </RoundButton>
      ) : null}
      {index < count - 1 ? (
        <RoundButton
          onPress={() => goTo(index + 1)}
          label="Next"
          size={36}
          style={[styles.chevron, { right: 10 }]}>
          <ChevronIcon size={18} color="#fff" />
        </RoundButton>
      ) : null}
    </>
  );
}

/** Eyebrow/title/scrubber/cue plus the thumbnail strip. Holds the tallest
 * item's text height (via a hidden measuring layer, one copy per item) so
 * the media area above never resizes as you swipe between pages. */
function BottomPanel({
  items,
  index,
  goTo,
  title,
  cue,
  controls,
}: {
  items: ExerciseMediaItem[];
  index: number;
  goTo: (index: number) => void;
  title: string;
  cue: string | null;
  controls: VideoControls;
}) {
  const insets = useSafeAreaInsets();
  const [minHeight, setMinHeight] = useState(0);
  const heights = useRef<number[]>([]);
  const photoCount = items.filter((m) => m.kind === "photo").length;
  const onMeasure = (k: number) => (e: LayoutChangeEvent) => {
    heights.current[k] = e.nativeEvent.layout.height;
    const max = Math.max(0, ...heights.current.filter(Boolean));
    setMinHeight((h) => (Math.abs(h - max) > 0.5 ? max : h));
  };
  const panelText = (item: ExerciseMediaItem) => (
    <PanelText
      item={item}
      photoCount={photoCount}
      title={title}
      cue={cue}
      videoDuration={controls.engineState.duration}
      scrubRow={
        <VideoScrubRow
          currentTime={controls.displayTime}
          duration={controls.engineState.duration}
          rate={controls.rate}
          onSeek={controls.handleSeek}
          onRateChange={controls.handleRateChange}
        />
      }
    />
  );

  return (
    <View
      style={{
        backgroundColor: colors.mediaPanel,
        paddingTop: 16,
        paddingBottom: insets.bottom + 16,
      }}>
      <View className="px-5" style={{ minHeight }}>
        {panelText(items[index]!)}
        <View
          pointerEvents="none"
          style={styles.measureLayer}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden>
          {items.map((m, k) => (
            <View
              key={m.key}
              onLayout={onMeasure(k)}
              style={styles.measureItem}>
              {panelText(m)}
            </View>
          ))}
        </View>
      </View>
      {items.length > 1 ? (
        <View className="mt-4">
          <MediaStrip items={items} index={index} onSelect={goTo} />
        </View>
      ) : null}
    </View>
  );
}

/** Full-screen swipeable viewer for an exercise's demo video and photos
 * (design: Exercise Media → "Full screen"). Mounted only while open, so the
 * video always starts fresh from 0:00 at 1x. Layout is a strict column —
 * header, media (flex: 1), bottom panel — and the media pages are sized to
 * whatever the media area measures, so nothing is ever pushed off-screen. */
function ViewerBody({
  startIndex,
  onClose,
  items,
  title,
  cue,
}: Omit<ExerciseMediaViewerProps, "startIndex"> & { startIndex: number }) {
  const { index, goTo, size, onLayout, scrollProps } = useMediaPager(
    items.length,
    startIndex,
  );
  const controls = usePlayerControls();
  const { engineRef, engineState } = controls;
  const videoIndex = items.findIndex((m) => m.kind === "video");

  // Swiping away from the video pauses it (it stays mounted, so coming back
  // resumes from the same spot). Also catches the engine's autoplay when
  // the viewer opens on a photo.
  useEffect(() => {
    if (index !== videoIndex && engineState.isPlaying) {
      engineRef.current?.pause();
    }
  }, [index, videoIndex, engineState.isPlaying, engineRef]);

  return (
    <View className="flex-1">
      <ViewerHeader
        title={title}
        index={index}
        count={items.length}
        onClose={onClose}
      />
      <View style={{ flex: 1, minHeight: 0 }} onLayout={onLayout}>
        {size ? (
          <ScrollView
            {...scrollProps}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}>
            {items.map((m) =>
              m.kind === "video" ? (
                <VideoPage
                  key={m.key}
                  item={m}
                  size={size}
                  controls={controls}
                />
              ) : (
                <PhotoPage key={m.key} uri={m.url} size={size} />
              ),
            )}
          </ScrollView>
        ) : null}
        <Chevrons index={index} count={items.length} goTo={goTo} />
      </View>
      <BottomPanel
        items={items}
        index={index}
        goTo={goTo}
        title={title}
        cue={cue}
        controls={controls}
      />
    </View>
  );
}

export function ExerciseMediaViewer({
  startIndex,
  onClose,
  items,
  title,
  cue,
}: ExerciseMediaViewerProps) {
  const visible = startIndex !== null && items.length > 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      {/* Top edge only — the bottom panel pads itself so its own background
       * runs under the home indicator. */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.mediaBackdrop }}
        edges={["top"]}>
        {visible ? (
          <ViewerBody
            startIndex={startIndex}
            onClose={onClose}
            items={items}
            title={title}
            cue={cue}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chevron: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(26,23,24,0.7)",
  },
  measureLayer: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 0,
    opacity: 0,
  },
  measureItem: { position: "absolute", left: 0, right: 0, top: 0 },
});
