import { gradients } from "@/src/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";

type GradientCardProps = {
  children: ReactNode;
  /** Applied to the outer clipped/bordered wrapper — margin, rounding.
   * Must include a `rounded-*` class; there's no default. */
  className: string;
  /** Applied to the inner content layer — padding. */
  contentClassName?: string;
  onPress?: (e: GestureResponderEvent) => void;
};

/** Program hero card: the brand's diagonal rust → dark brown gradient.
 * Shared between the program detail header and the program list/dashboard
 * cards so both stay visually in sync. */
export function GradientCard({
  children,
  className,
  contentClassName = "",
  onPress,
}: GradientCardProps) {
  const Content = onPress ? Pressable : View;
  return (
    <View className={`overflow-hidden ${className}`}>
      <LinearGradient
        colors={gradients.programCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Content onPress={onPress} className={contentClassName}>
        {children}
      </Content>
    </View>
  );
}
