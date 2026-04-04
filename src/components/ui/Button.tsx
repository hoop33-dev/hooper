import { Pressable, PressableProps, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StyledLinearGradient } from "@/src/lib/nativewind-interop";
import { colors } from "@/src/constants/theme";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "inverted" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  iconLeft?: IoniconsName;
  iconRight?: IoniconsName;
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

export function Button({
  variant = "primary",
  size = "md",
  children,
  iconLeft,
  iconRight,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const { container, text, iconSize, iconOnlyContainer } = sizeClasses[size];
  const opacity = disabled ? 0.4 : 1;
  const iconOnly = !children && (!!iconLeft || !!iconRight);
  const containerClass = iconOnly ? iconOnlyContainer : container;

  // Resolves icon color token based on variant
  const iconColorMap: Record<ButtonVariant, string> = {
    primary: "on-surface",
    secondary: "on-surface",
    inverted: "dark-gray",
    outline: "on-surface",
  };
  const iconColor = iconColorMap[variant];

  // Text color class based on variant
  const textColorClass =
    variant === "inverted" ? "text-dark-gray" : "text-on-surface";

  function renderInner(pressed: boolean) {
    return (
      <View
        style={{
          opacity: pressed ? 0.8 : 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        {iconLeft && <Icon name={iconLeft} size={iconSize} color={iconColor} />}
        {children ? (
          <Text className={`font-lexend-semibold ${textColorClass} ${text}`}>
            {children}
          </Text>
        ) : null}
        {iconRight && (
          <Icon name={iconRight} size={iconSize} color={iconColor} />
        )}
      </View>
    );
  }

  if (variant === "primary") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`overflow-hidden rounded-full active:opacity-80 ${className}`}
        {...props}
      >
        {({ pressed }) => (
          <StyledLinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ opacity: pressed ? 0.8 : 1 }}
            className={`items-center justify-center rounded-full ${containerClass}`}
          >
            {renderInner(pressed)}
          </StyledLinearGradient>
        )}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`bg-brand-blue items-center justify-center rounded-full active:opacity-80 ${containerClass} ${className}`}
        {...props}
      >
        {({ pressed }) => renderInner(pressed)}
      </Pressable>
    );
  }

  if (variant === "inverted") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`bg-on-surface items-center justify-center rounded-full active:opacity-80 ${containerClass} ${className}`}
        {...props}
      >
        {({ pressed }) => renderInner(pressed)}
      </Pressable>
    );
  }

  // outline
  return (
    <Pressable
      disabled={disabled}
      className={`items-center justify-center rounded-full border border-white/15 active:opacity-80 ${containerClass} ${className}`}
      style={{ opacity }}
      {...props}
    >
      {({ pressed }) => renderInner(pressed)}
    </Pressable>
  );
}
