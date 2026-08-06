import { colors } from "@/src/constants/theme";
import { Pressable, View } from "react-native";

import { PauseIcon, PlayIcon } from "./icons";
import { Caption } from "@/src/components/ui";

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
    <View className="flex-row items-center justify-between px-5 pb-2.5 pt-[54px]">
      <View className="flex-row items-center gap-1">
        {Array.from({ length: blockCount }, (_, i) => (
          <View
            key={i}
            className="h-[3px] rounded-full"
            style={{
              width: i === blockIdx ? 22 : 8,
              backgroundColor: doneFlags[i]
                ? colors.success
                : i === blockIdx
                  ? colors.brandOrange
                  : "rgba(255,255,255,0.1)",
            }}
          />
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
          <Caption className={paused ? "text-white" : ""}>{paused ? "Resume" : "Pause"}</Caption>
        </Pressable>
        <Pressable
          onPress={onExit}
          className="rounded-full border px-3 py-1.5"
          style={{ backgroundColor: colors.surface2, borderColor: colors.borderSubtle }}>
          <Caption>Exit</Caption>
        </Pressable>
      </View>
    </View>
  );
}
