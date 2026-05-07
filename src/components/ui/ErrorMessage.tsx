import { View, Text } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@/src/constants/theme";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <View className="mt-1 flex-row items-center gap-1">
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Circle cx={6} cy={6} r={5.5} stroke={colors.danger} strokeWidth={1} />
        <Path
          d="M6 3.5V6.5"
          stroke={colors.danger}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Circle cx={6} cy={8.5} r={0.6} fill={colors.danger} />
      </Svg>
      <Text className="text-danger text-[11px]" style={{ fontFamily: "Inter" }}>
        {message}
      </Text>
    </View>
  );
}
