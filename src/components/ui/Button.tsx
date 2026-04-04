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
  sm: { container: "px-4 py-2", text: "text-sm leading-5" },
  md: { container: "px-6 py-3", text: "text-base leading-6" },
  lg: { container: "px-8 py-4", text: "text-lg leading-7" },
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const { container, text } = sizeClasses[size];
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
            <Text className={`font-lexend-semibold text-white ${text}`}>
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
            <Text className={`font-lexend-semibold text-white ${text}`}>
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
            <Text className={`font-lexend-semibold text-dark-gray ${text}`}>
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
      className={`items-center justify-center rounded-full border border-white/15 active:opacity-80 ${container} ${className}`}
      style={{ opacity }}
      {...props}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          <Text className={`font-lexend-semibold text-on-surface ${text}`}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
