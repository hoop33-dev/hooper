import { Caption, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { Pressable, View } from "react-native";

import { XIcon } from "../../dashboard/icons";
import {
  PauseIcon,
  PlayIcon,
  SkipBack10Icon,
  SkipForward10Icon,
} from "../icons";
import { ScrubBar } from "./ScrubBar";
import type { PlayerRate } from "./types";

const RATES: PlayerRate[] = [0.5, 1, 1.5];

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TimeChip({
  currentTime,
  duration,
}: {
  currentTime: number;
  duration: number;
}) {
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <Caption className="text-text-primary">
        {formatTime(currentTime)} / {formatTime(duration)}
      </Caption>
    </View>
  );
}

function SpeedButton({
  rate,
  selected,
  onPress,
}: {
  rate: PlayerRate;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-md px-2.5 py-1"
      style={{
        backgroundColor: selected
          ? colors.brandOrange
          : "rgba(255,255,255,0.08)",
      }}>
      <Caption
        className={selected ? "text-text-inverse" : "text-text-secondary"}>
        {rate}x
      </Caption>
    </Pressable>
  );
}

type PlayerControlsProps = {
  title: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  rate: PlayerRate;
  onPlayPause: () => void;
  onSkip: (deltaSeconds: number) => void;
  onSeek: (seconds: number) => void;
  onRateChange: (rate: PlayerRate) => void;
  onClose: () => void;
  /** YouTube renders its own native play/pause/scrub/speed UI (see
   * YouTubeVideoSurface's `controls: 1`) — running our own full overlay on
   * top of that duplicated every control (two play buttons, etc.), so for
   * that engine this renders only the close button and leaves the rest to
   * YouTube's own controls. */
  minimal?: boolean;
};

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <View
      pointerEvents="box-none"
      className="flex-row items-center justify-end px-4 pt-4">
      <Pressable
        onPress={onClose}
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <XIcon size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

function TransportRow({
  currentTime,
  duration,
  isPlaying,
  rate,
  onPlayPause,
  onSkip,
  onRateChange,
}: Pick<
  PlayerControlsProps,
  | "currentTime"
  | "duration"
  | "isPlaying"
  | "rate"
  | "onPlayPause"
  | "onSkip"
  | "onRateChange"
>) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-4">
        <Pressable onPress={() => onSkip(-10)} hitSlop={8}>
          <SkipBack10Icon size={22} color="#fff" />
        </Pressable>
        <Pressable
          onPress={onPlayPause}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.brandOrange }}>
          {isPlaying ? (
            <PauseIcon size={16} color="#fff" />
          ) : (
            <PlayIcon size={14} color="#fff" />
          )}
        </Pressable>
        <Pressable onPress={() => onSkip(10)} hitSlop={8}>
          <SkipForward10Icon size={22} color="#fff" />
        </Pressable>
        <Caption className="text-text-secondary">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Caption>
      </View>
      <View className="flex-row items-center gap-1.5">
        {RATES.map((r) => (
          <SpeedButton
            key={r}
            rate={r}
            selected={r === rate}
            onPress={() => onRateChange(r)}
          />
        ))}
      </View>
    </View>
  );
}

function FullControls({
  title,
  currentTime,
  duration,
  isPlaying,
  rate,
  onPlayPause,
  onSkip,
  onSeek,
  onRateChange,
  onClose,
}: Omit<PlayerControlsProps, "minimal">) {
  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      {/* Top bar */}
      <View
        pointerEvents="box-none"
        className="flex-row items-center justify-between px-4 pt-4">
        <TimeChip currentTime={currentTime} duration={duration} />
        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <XIcon size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Big centered play button — hidden once playback starts */}
      {!isPlaying ? (
        <View
          pointerEvents="box-none"
          className="flex-1 items-center justify-center">
          <Pressable
            onPress={onPlayPause}
            className="h-20 w-20 items-center justify-center rounded-full border-2"
            style={{ borderColor: colors.brandOrange }}>
            <PlayIcon size={26} color={colors.brandOrange} />
          </Pressable>
        </View>
      ) : (
        <View pointerEvents="none" className="flex-1" />
      )}

      {/* Bottom transport */}
      <View pointerEvents="box-none" className="gap-3 px-4 pb-4">
        <Title className="text-text-primary">{title}</Title>
        <ScrubBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
        <TransportRow
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          rate={rate}
          onPlayPause={onPlayPause}
          onSkip={onSkip}
          onRateChange={onRateChange}
        />
      </View>
    </View>
  );
}

export function PlayerControls({
  minimal = false,
  ...props
}: PlayerControlsProps) {
  if (minimal) {
    return (
      <View pointerEvents="box-none" className="absolute inset-0">
        <CloseButton onClose={props.onClose} />
      </View>
    );
  }

  return <FullControls {...props} />;
}
