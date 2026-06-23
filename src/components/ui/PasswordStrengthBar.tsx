import { View, Text } from "react-native";
import { getPasswordStrength } from "@/src/lib/passwordStrength";
import { colors, fonts} from "@/src/constants/theme";

type Props = {
  value: string;
};

export function PasswordStrengthBar({ value }: Props) {
  const strength = getPasswordStrength(value);

  if (strength.level === "empty") return null;

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor:
                i < strength.filledSegments ? strength.color : colors.surface3,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          fontSize: 11,
          fontWeight: "600",
          color: strength.color,
        }}
      >
        {strength.label}
      </Text>
    </View>
  );
}
