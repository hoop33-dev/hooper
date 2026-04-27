import { type ReactNode } from "react";
import { Pressable, View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  error?: string;
};

export function Checkbox({ checked, onChange, label, error }: CheckboxProps) {
  return (
    <View style={{ gap: 4 }}>
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
              ? "rgba(241,88,37,0.06)"
              : "#2D2829",
          borderWidth: 1.5,
          borderColor: error
            ? "rgba(229,62,62,0.3)"
            : checked
              ? "rgba(241,88,37,0.25)"
              : "rgba(255,255,255,0.08)",
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
              ? "#E53E3E"
              : checked
                ? "#F15825"
                : "rgba(255,255,255,0.16)",
            backgroundColor: checked ? "#F15825" : "transparent",
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
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 12.5 * 1.55,
                flex: 1,
              }}
            >
              {label}
            </Text>
          ) : (
            <View style={{ flex: 1 }}>{label}</View>
          )
        ) : null}
      </Pressable>

      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 2,
          }}
        >
          <Text style={{ fontFamily: "Inter", fontSize: 11, color: "#E53E3E" }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
