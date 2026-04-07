import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  Text,
  View,
} from "react-native";
import { colors } from "@/src/constants/theme";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "inverted" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  className?: string;
}

const sizeClasses: Record<
  ButtonSize,
  {
    container: string;
    text: string;
    iconSize: number;
    iconOnlyContainer: string;
  }
> = {
  sm: {
    container: "px-4 py-2",
    text: "text-sm leading-5",
    iconSize: 16,
    iconOnlyContainer: "w-9 h-9",
  },
  md: {
    container: "px-6 py-3",
    text: "text-base leading-6",
    iconSize: 20,
    iconOnlyContainer: "w-11 h-11",
  },
  lg: {
    container: "px-8 py-4",
    text: "text-lg leading-7",
    iconSize: 24,
    iconOnlyContainer: "w-14 h-14",
  },
};

// Resolved hex colors for icons per variant (can't use className tokens in JS)
const iconColorByVariant: Record<ButtonVariant, string> = {
  primary: colors.onSurface,
  secondary: colors.onSurface,
  inverted: colors.surface,
  outline: colors.onSurface,
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const { container, text, iconSize, iconOnlyContainer } = sizeClasses[size];
  const iconOnly = !children && (!!iconLeft || !!iconRight);
  const containerClass = iconOnly ? iconOnlyContainer : container;
  const isDisabled = disabled || loading;
  const iconColor = iconColorByVariant[variant];

  // Spinner rotation animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      spinAnim.setValue(0);
    }
  }, [loading, spinAnim]);
  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const textColorClass =
    variant === "inverted" ? "text-surface" : "text-on-surface";

  function renderInner(pressed: boolean) {
    return (
      <View
        className={`flex-row items-center gap-2 ${pressed ? "opacity-70" : "opacity-100"}`}
      >
        {/* Left slot: spinner when loading, icon otherwise */}
        {loading ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon name="loader" size={iconSize} color={iconColor} />
          </Animated.View>
        ) : (
          iconLeft && <Icon name={iconLeft} size={iconSize} color={iconColor} />
        )}

        {children ? (
          <Text className={`font-lexend-semibold ${textColorClass} ${text}`}>
            {children}
          </Text>
        ) : null}

        {/* Right icon — hidden while loading */}
        {!loading && iconRight && (
          <Icon name={iconRight} size={iconSize} color={iconColor} />
        )}
      </View>
    );
  }

  if (variant === "primary") {
    return (
      <Pressable
        disabled={isDisabled}
        className={`bg-primary items-center justify-center rounded-full active:opacity-75 ${isDisabled ? "opacity-40" : ""} ${containerClass} ${className}`}
        {...props}
      >
        {({ pressed }) => renderInner(pressed)}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        disabled={isDisabled}
        className={`bg-brand-blue items-center justify-center rounded-full active:bg-[#00338A] active:opacity-90 ${isDisabled ? "opacity-40" : ""} ${containerClass} ${className}`}
        {...props}
      >
        {({ pressed }) => renderInner(pressed)}
      </Pressable>
    );
  }

  if (variant === "inverted") {
    return (
      <Pressable
        disabled={isDisabled}
        className={`bg-on-surface items-center justify-center rounded-full active:bg-[#D0D0D0] active:opacity-90 ${isDisabled ? "opacity-40" : ""} ${containerClass} ${className}`}
        {...props}
      >
        {({ pressed }) => renderInner(pressed)}
      </Pressable>
    );
  }

  // outline
  return (
    <Pressable
      disabled={isDisabled}
      className={`border-outline items-center justify-center rounded-full border active:opacity-80 ${isDisabled ? "opacity-40" : ""} ${containerClass} ${className}`}
      {...props}
    >
      {({ pressed }) => renderInner(pressed)}
    </Pressable>
  );
}
