import { Button, H3, Lead } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { View } from "react-native";

import { PauseIcon, PlayIcon } from "./icons";

type PauseOverlayProps = {
  onResume: () => void;
};

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <View
      className="absolute inset-0 items-center justify-center gap-5"
      style={{ backgroundColor: "rgba(26,23,24,0.94)" }}>
      <View className="bg-surface-2 border-border-subtle h-[72px] w-[72px] items-center justify-center rounded-full border">
        <PauseIcon size={24} color={colors.textSecondary} />
      </View>
      <H3>Paused</H3>
      <Button variant="primary" size="lg" onPress={onResume}>
        <View className="flex-row items-center gap-2">
          <PlayIcon size={12} color="#fff" />
          <Lead className="text-white">Resume workout</Lead>
        </View>
      </Button>
    </View>
  );
}
