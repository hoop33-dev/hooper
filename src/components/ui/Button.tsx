import { useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "@/src/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "navy" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-5",
  md: "h-12 px-7",
  lg: "h-14 px-7",
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: "text-[11px] tracking-[0.88px]",
  md: "text-[13px] tracking-[1.04px]",
  lg: "text-[15px] tracking-[1.2px]",
};

function variantClasses(variant: ButtonVariant, disabled: boolean) {
  if (disabled) return "bg-orange-tint-20";
  switch (variant) {
    case "primary":
      return "bg-brand-orange";
    case "secondary":
      return "bg-transparent border border-border-strong";
    case "navy":
      return "bg-brand-navy";
    case "ghost":
      return "bg-orange-tint-10";
    case "icon":
      return "bg-surface-2 border border-border-subtle";
  }
}

function variantTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return colors.textDisabled;
  switch (variant) {
    case "primary":
    case "navy":
    case "secondary":
    case "icon":
      return colors.textPrimary;
    case "ghost":
      return colors.brandOrange;
  }
}

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  style,
  children,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  if (variant === "icon") {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className={`h-12 w-12 items-center justify-center rounded-full ${variantClasses(
          "icon",
          disabled,
        )} ${className}`}
        style={[
          {
            transform: [{ scale: pressed ? 0.97 : 1 }],
            opacity: pressed ? 0.85 : 1,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={`flex-row items-center justify-center rounded-full ${sizeClasses[size]} ${variantClasses(
        variant,
        disabled,
      )} ${className}`}
      style={[
        {
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <Text
          className={`font-inter font-bold uppercase ${sizeTextClasses[size]}`}
          style={{ color: variantTextColor(variant, disabled) }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
