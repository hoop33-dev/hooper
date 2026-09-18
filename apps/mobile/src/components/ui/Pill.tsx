import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type PillProps = {
  /** Optional leading icon. */
  icon?: ReactNode;
  /** The pill's text — pass a Typography component so the caller controls the style. */
  children: ReactNode;
  /**
   * Accent colour (hex). When provided the pill is tinted from it;
   * otherwise it uses the neutral surface treatment.
   */
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A small rounded chip for inline metadata — region tags, role chips, etc.
 * Neutral by default; pass `color` for an accent-tinted variant.
 */
export function Pill({
  icon,
  children,
  color,
  className = "",
  style,
}: PillProps) {
  const neutral = !color;
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1 ${
        neutral ? "border-border-subtle bg-white/5" : ""
      } ${className}`}
      style={[
        color
          ? { backgroundColor: `${color}14`, borderColor: `${color}30` }
          : null,
        style,
      ]}>
      {icon}
      {children}
    </View>
  );
}
