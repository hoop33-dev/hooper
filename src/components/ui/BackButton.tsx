import { colors } from "@/src/constants/theme";
import { Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

type BackButtonProps = {
  label?: string;
  onPress: () => void;
  className?: string;
};

export function BackButton({
  label = "Back",
  onPress,
  className = "mb-6",
}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 self-start ${className}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          d="M10 3L5 8L10 13"
          stroke={colors.textTertiary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-text-tertiary text-[13px]"
        style={{ fontFamily: "Inter" }}>
        {label}
      </Text>
    </Pressable>
  );
}
