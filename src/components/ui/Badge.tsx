import { colors } from "@/src/constants/theme";
import { Text, View, type ViewProps } from "react-native";

export type BadgeVariant =
  | "orange"
  | "navy"
  | "green"
  | "red"
  | "white"
  | "outline";

type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  /** Show a colored dot before the text */
  dot?: boolean;
  children: string;
  className?: string;
};

const styles: Record<
  BadgeVariant,
  { container: string; text: string; dot: string }
> = {
  orange: {
    container: "bg-orange-tint-20",
    text: "text-brand-orange",
    dot: "bg-brand-orange",
  },
  navy: {
    container: "bg-brand-navy/60 border border-[rgba(0,71,186,0.4)]",
    text: "text-[#6EA0FF]",
    dot: "bg-brand-blue",
  },
  green: {
    container: "bg-[rgba(56,161,105,0.15)]",
    text: "text-[#68D391]",
    dot: "bg-success",
  },
  red: {
    container: "bg-[rgba(229,62,62,0.15)]",
    text: "text-[#FC8181]",
    dot: "bg-danger",
  },
  white: {
    container: "bg-white/10",
    text: "text-text-secondary",
    dot: "bg-white/60",
  },
  outline: {
    container: "bg-transparent border border-[rgba(241,88,37,0.4)]",
    text: "text-brand-orange",
    dot: "bg-brand-orange",
  },
};

export function Badge({
  variant = "orange",
  dot = false,
  children,
  className = "",
  ...rest
}: BadgeProps) {
  const s = styles[variant];
  return (
    <View
      className={`flex-row items-center self-start rounded-full px-3 py-1 ${s.container} ${className}`}
      {...rest}>
      {dot && <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      <Text
        className={s.text}
        style={{
          fontFamily: "Inter",
          fontWeight: "600",
          fontSize: 11,
          letterSpacing: 11 * 0.04,
        }}>
        {children}
      </Text>
    </View>
  );
}

/** Square-ish tag — for non-status metadata (categories, muscle groups, etc.) */
export function Tag({
  children,
  className = "",
  ...rest
}: ViewProps & { children: string; className?: string }) {
  return (
    <View
      className={`border-border-subtle bg-surface-2 self-start rounded-md border px-2.5 py-1 ${className}`}
      {...rest}>
      <Text
        className="text-text-secondary"
        style={{
          fontFamily: "Inter",
          fontWeight: "500",
          fontSize: 11,
        }}>
        {children}
      </Text>
    </View>
  );
}

/** Small numeric badge — orange circle with white number */
export function NumberBadge({ count }: { count: number | string }) {
  return (
    <View className="bg-brand-orange h-5 w-5 items-center justify-center rounded-full">
      <Text
        style={{
          fontFamily: "Inter",
          fontWeight: "700",
          fontSize: 11,
          color: colors.textPrimary,
        }}>
        {count}
      </Text>
    </View>
  );
}
