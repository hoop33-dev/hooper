import { useState } from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { colors } from "@/src/constants/theme";

type TextButtonProps = Omit<PressableProps, "children" | "style"> & {
  /** Text shown inside the clickable region */
  children: string;
  /** Color tone — defaults to brand orange */
  tone?: "brand" | "muted" | "interactive";
  /** Optional weight override */
  weight?: "regular" | "medium" | "semibold" | "bold";
  /** Optional font size (defaults to inherit body size) */
  size?: number;
  /** Underline the text */
  underline?: boolean;
  className?: string;
};

const toneColor: Record<NonNullable<TextButtonProps["tone"]>, string> = {
  brand: colors.brandOrange,
  muted: colors.textSecondary,
  interactive: colors.brandBlue,
};

const weightMap: Record<NonNullable<TextButtonProps["weight"]>, string> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function TextButton({
  children,
  tone = "brand",
  weight = "semibold",
  size = 14,
  underline = false,
  disabled = false,
  className = "",
  ...rest
}: TextButtonProps) {
  const [pressed, setPressed] = useState(false);
  const color = disabled ? colors.textDisabled : toneColor[tone];

  return (
    <Pressable
      accessibilityRole="link"
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={className}
      hitSlop={6}
      {...rest}
    >
      <Text
        style={{
          fontFamily: "Inter",
          fontWeight: weightMap[weight] as "400" | "500" | "600" | "700",
          fontSize: size,
          color,
          textDecorationLine: underline ? "underline" : "none",
          opacity: pressed ? 0.6 : 1,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
