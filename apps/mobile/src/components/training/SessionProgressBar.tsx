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
  const width = useSharedValue(pct);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 300 });
  }, [pct, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View className="px-5 pb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Caption>
          {doneSets}/{totalSets} sets
        </Caption>
        <Caption className="text-white">{pct}%</Caption>
      </View>
      <View className="h-1 rounded-full bg-white/10">
        <Animated.View
          className="bg-brand-orange h-full rounded-full"
          style={fillStyle}
        />
      </View>
    </View>
  );
}
