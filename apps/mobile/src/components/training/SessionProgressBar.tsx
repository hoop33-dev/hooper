import { Caption } from "@/src/components/ui";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type SessionProgressBarProps = {
  doneSets: number;
  totalSets: number;
};

/** Overall session progress — sets completed across every block, not just
 * the one currently in view. Purely a display of derived state (setsState
 * vs. each block_exercise's planned set count); nothing here is persisted. */
export function SessionProgressBar({
  doneSets,
  totalSets,
}: SessionProgressBarProps) {
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const progress = useSharedValue(pct);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 300 });
  }, [pct, progress]);

  // Slides a full-width fill in from the left rather than animating its
  // `width` — a transform is applied on the UI thread without re-running
  // layout every frame of the animation.
  const fillStyle = useAnimatedStyle(() => ({
    // Hidden until the track is measured — at width 0 the fill would sit
    // untranslated and flash a full bar for a frame.
    opacity: trackWidth.value > 0 ? 1 : 0,
    transform: [{ translateX: -trackWidth.value * (1 - progress.value / 100) }],
  }));

  return (
    <View className="px-5 pb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Caption>
          {doneSets}/{totalSets} sets
        </Caption>
        <Caption className="text-white">{pct}%</Caption>
      </View>
      <View
        className="h-1 overflow-hidden rounded-full bg-white/10"
        onLayout={(e) => {
          trackWidth.value = e.nativeEvent.layout.width;
        }}>
        <Animated.View
          className="bg-brand-orange h-full w-full rounded-full"
          style={fillStyle}
        />
      </View>
    </View>
  );
}
