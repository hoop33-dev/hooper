import { useState } from "react";
import { Text, TextProps } from "react-native";
import { fonts } from "@/src/constants/theme";

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
  className,
  onPressIn,
  onPressOut,
  ...props
}: InlineButtonProps) {
  const [pressed, setPressed] = useState(false);
  const colorClass =
    variant === "secondary" ? "text-brand-blue" : "text-primary";
  const pressedStateClass = disabled
    ? "opacity-40"
    : pressed
      ? "opacity-65 underline"
      : "opacity-100";

  return (
    <Text
      onPress={disabled ? undefined : onPress}
      onPressIn={(event) => {
        if (!disabled) {
          setPressed(true);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      className={`font-lexend-semibold ${colorClass} ${pressedStateClass} ${className ?? ""}`}
      style={[
        {
          fontFamily: fonts.semibold,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
