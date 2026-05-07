import { type ReactNode } from "react";
import { Pressable, View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@/src/constants/theme";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  error?: string;
};

export function Checkbox({ checked, onChange, label, error }: CheckboxProps) {
  return (
    <View className="gap-1">
      <Pressable
        onPress={() => onChange(!checked)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          padding: 14,
          backgroundColor: error
            ? "rgba(229,62,62,0.12)"
            : checked
              ? colors.orangeTint10
              : colors.surface2,
          borderWidth: 1.5,
          borderColor: error
            ? "rgba(229,62,62,0.3)"
            : checked
              ? colors.orangeTint20
              : colors.borderSubtle,
          borderRadius: 10,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {/* Box */}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: error
              ? colors.danger
              : checked
                ? colors.brandOrange
                : colors.borderStrong,
            backgroundColor: checked ? colors.brandOrange : "transparent",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {checked && (
            <Svg width={11} height={8} viewBox="0 0 11 8" fill="none">
              <Path
                d="M1 4L4 7L10 1"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>

        {/* Label */}
        {label ? (
          typeof label === "string" ? (
            <Text className="font-inter text-[12.5px] text-text-secondary leading-[19.4px] flex-1">
              {label}
            </Text>
          ) : (
            <View style={{ flex: 1 }}>{label}</View>
          )
        ) : null}
      </Pressable>

      {error ? (
        <View className="flex-row items-center gap-1 px-0.5">
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
          <Text className="font-inter text-[11px] text-danger">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
