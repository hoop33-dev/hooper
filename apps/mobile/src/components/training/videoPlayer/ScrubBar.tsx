import { colors } from "@/src/constants/theme";
import { useRef, useState, type RefObject } from "react";
import { PanResponder, View } from "react-native";

const THUMB_SIZE = 12;

type ScrubBarProps = {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
};

/** Same PanResponder + `latest`-ref approach as ui/Slider.tsx, extended with
 * a `dragTime` override: unlike Slider's single static value, currentTime
 * here keeps updating live from playback, so a drag in progress must own
 * the displayed position rather than fight the live updates — committing
 * one seek on release. */
function useScrubPanResponder(
  trackWidth: number,
  duration: number,
  pageX: RefObject<number>,
  onDragChange: (time: number) => void,
  onCommit: (time: number) => void,
) {
  const latest = useRef({ trackWidth, duration, onDragChange, onCommit });
  latest.current = { trackWidth, duration, onDragChange, onCommit };

  function positionToTime(x: number) {
    const { trackWidth, duration } = latest.current;
    if (trackWidth <= 0 || duration <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    return ratio * duration;
  }

  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, gesture) =>
        latest.current.onDragChange(positionToTime(gesture.x0 - pageX.current)),
      onPanResponderMove: (_e, gesture) =>
        latest.current.onDragChange(
          positionToTime(gesture.moveX - pageX.current),
        ),
      onPanResponderRelease: (_e, gesture) =>
        latest.current.onCommit(positionToTime(gesture.moveX - pageX.current)),
    }),
  ).current;
}

export function ScrubBar({ currentTime, duration, onSeek }: ScrubBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const containerRef = useRef<View>(null);
  const pageX = useRef(0);

  const panResponder = useScrubPanResponder(
    trackWidth,
    duration,
    pageX,
    setDragTime,
    (time) => {
      onSeek(time);
      setDragTime(null);
    },
  );

  const displayTime = dragTime ?? currentTime;
  const ratio =
    duration > 0 ? Math.min(1, Math.max(0, displayTime / duration)) : 0;
  const thumbCenter = trackWidth * ratio;

  return (
    <View
      ref={containerRef}
      onLayout={(e) => {
        setTrackWidth(e.nativeEvent.layout.width);
        containerRef.current?.measure((_x, _y, _w, _h, pgX) => {
          pageX.current = pgX;
        });
      }}
      {...panResponder.panHandlers}
      style={{ height: 24, justifyContent: "center" }}>
      <View
        style={{
          height: 3,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      />
      <View
        style={{
          position: "absolute",
          height: 3,
          width: thumbCenter,
          borderRadius: 999,
          backgroundColor: colors.brandOrange,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          left: thumbCenter - THUMB_SIZE / 2,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: colors.brandOrange,
        }}
      />
    </View>
  );
}
