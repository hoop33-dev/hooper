import { colors } from "@/src/constants/theme";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Caption } from "@/src/components/ui";
import { PauseIcon, PlayIcon } from "./icons";

type BlockProgressHeaderProps = {
  blockCount: number;
  blockIdx: number;
  doneFlags: boolean[];
  paused: boolean;
  pausing: boolean;
  onTogglePause: () => void;
  onExit: () => void;
};

export function BlockProgressHeader({
  blockCount,
  blockIdx,
  doneFlags,
  paused,
  pausing,
  onTogglePause,
  onExit,
}: BlockProgressHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-[54px] pb-2.5">
      <View className="flex-row items-center gap-1">
        {Array.from({ length: blockCount }, (_, i) => (
          <ProgressPill key={i} active={i === blockIdx} done={doneFlags[i]} />
        ))}
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onTogglePause}
          disabled={pausing}
          className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
          style={{
            backgroundColor: paused ? colors.brandOrange : colors.surface2,
            borderColor: paused ? colors.brandOrange : colors.borderSubtle,
          }}>
          {paused ? (
            <PlayIcon size={10} color="#fff" />
          ) : (
            <PauseIcon size={10} color={colors.textSecondary} />
          )}
          <Caption className={paused ? "text-white" : ""}>
            {paused ? "Resume" : "Pause"}
          </Caption>
        </Pressable>
        <Pressable
          onPress={onExit}
          className="rounded-full border px-3 py-1.5"
          style={{
            backgroundColor: colors.surface2,
            borderColor: colors.borderSubtle,
          }}>
          <Caption>Exit</Caption>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressPill({ active, done }: { active: boolean; done: boolean }) {
  const width = useSharedValue(active ? 22 : 8);

  useEffect(() => {
    width.value = withTiming(active ? 22 : 8, { duration: 250 });
  }, [active, width]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: done
      ? colors.success
      : active
        ? colors.brandOrange
        : "rgba(255,255,255,0.1)",
  }));

  return <Animated.View className="h-[3px] rounded-full" style={style} />;
}
