import { View, Text, ViewProps } from "react-native";

export type PillVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "inverted"
  | "tertiary";

interface PillProps extends ViewProps {
  variant?: PillVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<PillVariant, { container: string; text: string }> =
  {
    /** Orange tint — XP rewards, completion moments */
    primary: {
      container: "bg-primary/20",
      text: "text-primary",
    },
    /** Blue tint — status, info, active tabs */
    secondary: {
      container: "bg-brand-blue/20",
      text: "text-brand-blue",
    },
    /** Ghost border — low-priority or custom-colored labels */
    outline: {
      container: "border border-white/15",
      text: "text-on-surface",
    },
    /** Light background — emphasis on dark surfaces */
    inverted: {
      container: "bg-on-surface",
      text: "text-dark-gray",
    },
    /** Navy — role chips: Coach, Player, Org identity markers */
    tertiary: {
      container: "bg-navy",
      text: "text-on-surface",
    },
  };

export function Pill({
  variant = "primary",
  children,
  className = "",
  style,
  ...props
}: PillProps) {
  const { container, text } = variantClasses[variant];

  return (
    <View
      className={`items-center justify-center self-start rounded-full px-3 py-1 ${container} ${className}`}
      style={style}
      {...props}
    >
      <Text
        className={text}
        style={{
          fontFamily: "Lexend_600SemiBold",
          fontSize: 12,
          lineHeight: 14,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
