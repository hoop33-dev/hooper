import { colors } from "@/src/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type RadioTileProps = {
  id: string;
  label: string;
  title: string;
  body: string;
  icon: ReactNode;
  accent: string;
  accentDim: string;
  accentBorder: string;
  selected: boolean;
  onPress: () => void;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function RadioTile({
  id: _id,
  label,
  title,
  body,
  icon,
  accent,
  accentDim,
  accentBorder,
  selected,
  onPress,
}: RadioTileProps) {
  const [pressed, setPressed] = useState(false);

  const gradientColors: [string, string] = selected
    ? [hexToRgba(accent, 0.2), hexToRgba(accent, 0)]
    : ["transparent", "transparent"];

  // Android: elevation creates a hardware layer that clips gradient children
  // regardless of the view hierarchy arrangement. Disable elevation on Android
  // (shadow props have no effect there anyway — elevation is the only mechanism).
  return (
    <View
      style={{
        backgroundColor: selected ? accentDim : colors.surface2,
        borderWidth: 1.5,
        borderColor: selected ? accentBorder : colors.borderSubtle,
        borderRadius: 16,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.88 : 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: selected ? 4 : 2 },
        shadowOpacity: selected ? 0.4 : 0.3,
        shadowRadius: selected ? 20 : 8,
        elevation: Platform.OS === "android" ? 0 : selected ? 8 : 3,
      }}>
      {/* overflow:"hidden" clips the gradient to the tile's rounded corners */}
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{ borderRadius: 14.5, overflow: "hidden" }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, paddingBottom: 18 }}>
          {/* Top row: icon container + radio indicator */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
            }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: selected
                  ? accentDim
                  : "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: selected ? accentBorder : colors.borderSubtle,
                alignItems: "center",
                justifyContent: "center",
              }}>
              {icon}
            </View>

            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: selected ? accent : colors.borderStrong,
                backgroundColor: selected ? accent : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}>
              {selected && (
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
          </View>

          {/* Role label — uppercase caps */}
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: 10,
              letterSpacing: 10 * 0.14,
              textTransform: "uppercase",
              color: selected ? accent : colors.textTertiary,
              marginBottom: 5,
            }}>
            {label}
          </Text>

          {/* Title */}
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "800",
              fontSize: 22,
              letterSpacing: 22 * -0.03,
              color: colors.textPrimary,
              marginBottom: 8,
              lineHeight: 22 * 1.1,
            }}>
            {title}
          </Text>

          {/* Body */}
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 13 * 1.55,
              color: colors.textSecondary,
            }}>
            {body}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
