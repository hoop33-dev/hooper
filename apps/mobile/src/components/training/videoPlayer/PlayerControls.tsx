import { Caption } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { Pressable, View } from "react-native";

import { PauseIcon, PlayIcon } from "../icons";
import { ScrubBar } from "./ScrubBar";
import type { PlayerRate } from "./types";

const RATES: PlayerRate[] = [0.5, 1, 1.5];

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** The 64px play/pause disc centred over the video — solid orange while
 * paused (the call to action), a translucent dark disc while playing so it
 * doesn't sit loudly over the footage. */
export function VideoPlayButton({
  isPlaying,
  onPress,
}: {
  isPlaying: boolean;
  onPress: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 items-center justify-center">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: isPlaying
            ? "rgba(26,23,24,0.5)"
            : "rgba(241,88,37,0.9)",
        }}>
        {isPlaying ? (
          <PauseIcon size={22} color="#fff" />
        ) : (
          <View style={{ marginLeft: 3 }}>
            <PlayIcon size={22} color="#fff" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** Scrub bar + elapsed/total + a single speed chip that cycles
 * 0.5x → 1x → 1.5x, rendered in the media viewer's bottom panel. */
export function VideoScrubRow({
  currentTime,
  duration,
  rate,
  onSeek,
  onRateChange,
}: {
  currentTime: number;
  duration: number;
  rate: PlayerRate;
  onSeek: (seconds: number) => void;
  onRateChange: (rate: PlayerRate) => void;
}) {
  const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length]!;
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <ScrubBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
      </View>
      <Caption
        className="text-text-secondary"
        style={{ fontVariant: ["tabular-nums"] }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </Caption>
      <Pressable
        onPress={() => onRateChange(nextRate)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Playback speed ${rate}x`}
        className="rounded-md px-2 py-1"
        style={{
          backgroundColor:
            rate === 1 ? "rgba(255,255,255,0.08)" : colors.brandOrange,
        }}>
        <Caption
          className={rate === 1 ? "text-text-secondary" : "text-text-primary"}>
          {rate}x
        </Caption>
      </Pressable>
    </View>
  );
}
