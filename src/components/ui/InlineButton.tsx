import { Text, TextProps } from "react-native";
import { colors, fonts } from "@/src/constants/theme";

interface InlineButtonProps extends Omit<TextProps, "onPress"> {
  onPress: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

/**
 * An inline pressable text element — sits within a prose `<Text>` block.
 *
 * Usage:
 * ```tsx
 * <Text>Want to do this? <InlineButton onPress={fn}>Click here!</InlineButton></Text>
 * ```
 */
export function InlineButton({
  onPress,
  children,
  variant = "primary",
  disabled = false,
  style,
  ...props
}: InlineButtonProps) {
  const color = variant === "secondary" ? colors.brandBlue : colors.primary;

  return (
    <Text
      onPress={disabled ? undefined : onPress}
      style={[
        {
          fontFamily: fonts.semibold,
          color,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
