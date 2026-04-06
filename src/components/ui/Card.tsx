import { View, ViewProps } from "react-native";
import { shadows } from "@/src/constants/theme";

interface CardProps extends ViewProps {
  /** Elevated cards use surface-high background + ambient shadow */
  elevated?: boolean;
  className?: string;
}

export function Card({
  elevated = false,
  className = "",
  style,
  children,
  ...props
}: CardProps) {
  const elevationStyle = elevated ? shadows.ambient : undefined;

  return (
    <View
      className={`rounded-3xl p-4 ${elevated ? "bg-surface-high" : "bg-surface-container"} ${className}`}
      style={[elevationStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
