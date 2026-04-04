import { Pressable, PressableProps, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "inverted" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "px-4 py-2", text: "text-sm" },
  md: { container: "px-6 py-3", text: "text-base" },
  lg: { container: "px-8 py-4", text: "text-lg" },
};

const sizeFontSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const { container, text: textSize } = sizeClasses[size];
  const fontSize = sizeFontSizes[size];
  const opacity = disabled ? 0.4 : 1;

  if (variant === "primary") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`overflow-hidden rounded-full active:opacity-80 ${className}`}
        {...props}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ opacity: pressed ? 0.8 : 1 }}
            className={`items-center justify-center rounded-full ${container}`}
          >
            <Text
              style={{
                fontFamily: "Lexend_600SemiBold",
                fontSize,
                color: "#FFFFFF",
              }}
            >
              {children}
            </Text>
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`bg-brand-blue items-center justify-center rounded-full active:opacity-80 ${container} ${className}`}
        {...props}
      >
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            <Text
              style={{
                fontFamily: "Lexend_600SemiBold",
                fontSize,
                color: "#FFFFFF",
              }}
            >
              {children}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  if (variant === "inverted") {
    return (
      <Pressable
        disabled={disabled}
        style={{ opacity }}
        className={`bg-on-surface items-center justify-center rounded-full active:opacity-80 ${container} ${className}`}
        {...props}
      >
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            <Text
              style={{
                fontFamily: "Lexend_600SemiBold",
                fontSize,
                color: colors.darkGray,
              }}
            >
              {children}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  // outline
  return (
    <Pressable
      disabled={disabled}
      className={`items-center justify-center rounded-full border active:opacity-80 ${container} ${className}`}
      style={{ opacity, borderColor: "rgba(245,245,245,0.15)" }}
      {...props}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          <Text
            style={{
              fontFamily: "Lexend_600SemiBold",
              fontSize,
              color: colors.onSurface,
            }}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
