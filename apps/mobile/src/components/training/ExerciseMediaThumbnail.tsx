import { colors } from "@/src/constants/theme";
import type { ExerciseMediaItem } from "@/src/lib/exerciseMedia";
import { mediaPreviewUrl } from "@/src/lib/exerciseMedia";
import { Image, Pressable, View } from "react-native";

import { PlayIcon } from "./icons";

/** Tile size + corner radius, in points. Set as numbers rather than
 * NativeWind classes so the stack edge below is positioned against exactly
 * the same box — NativeWind's native rem is 14, so `w-16` is 56, not 64. */
const TILE = 56;
const RADIUS = 12;
/** How far the stacked card peeks out above the tile. */
const PEEK = 5;
/** Horizontal inset of the stacked card on each side — wider than the
 * tile's corner radius so the card never shows beside the rounded corners. */
const INSET = 8;

/** A second card peeking out above the cover — the cue that there's more
 * than one item behind it. Centred on the tile and only overlapping its
 * top 2px, so it reads as a card tucked behind rather than a tab. */
function StackEdge({ size }: { size: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -PEEK,
        left: INSET,
        width: size - INSET * 2,
        height: PEEK + 2,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        backgroundColor: colors.surface3,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: colors.borderStrong,
      }}
    />
  );
}

/** The exercise's cover tile (design: "Cover stack") — its first media item
 * (the demo video, else photo 1), with a second card peeking out above it
 * when there's more than one item. Opens the media viewer at the cover.
 * Renders nothing without media. */
export function ExerciseMediaThumbnail({
  items,
  onOpen,
  faded,
  size = TILE,
}: {
  items: ExerciseMediaItem[];
  onOpen: (index: number) => void;
  faded?: boolean;
  /** Tile edge in points — smaller inside a sequence's step list. */
  size?: number;
}) {
  const cover = items[0];
  if (!cover) return null;
  const stacked = items.length > 1;
  const previewUrl = mediaPreviewUrl(cover);

  return (
    <View
      style={{
        width: size,
        height: size,
        // Room for the stack edge so it isn't jammed against the card's
        // top padding.
        marginTop: stacked ? PEEK : 0,
        opacity: faded ? 0.4 : 1,
      }}>
      {stacked ? <StackEdge size={size} /> : null}
      <Pressable
        onPress={() => onOpen(0)}
        accessibilityRole="button"
        accessibilityLabel={
          cover.kind === "video" ? "Play demo video" : "View photos"
        }
        className="items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          borderRadius: size < TILE ? 8 : RADIUS,
          backgroundColor: colors.surface3,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        }}>
        {previewUrl ? (
          <Image
            source={{ uri: previewUrl }}
            style={{ position: "absolute", width: size, height: size }}
            resizeMode="cover"
          />
        ) : null}
        {cover.kind === "video" ? (
          <View
            className="items-center justify-center rounded-full bg-black/35"
            style={{ width: size * 0.64, height: size * 0.64 }}>
            <PlayIcon size={size / 4} color="#fff" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/** "Video + 3 photos" — the text link under the exercise name. */
export function mediaSummary(items: ExerciseMediaItem[]): string {
  const photos = items.filter((m) => m.kind === "photo").length;
  const parts: string[] = [];
  if (items.some((m) => m.kind === "video")) parts.push("Video");
  if (photos) parts.push(`${photos} photo${photos > 1 ? "s" : ""}`);
  return parts.join(" + ");
}
