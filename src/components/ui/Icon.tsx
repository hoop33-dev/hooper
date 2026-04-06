import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/theme";

type IconSize = "sm" | "md" | "lg";
type IconColor = keyof typeof colorMap;

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

const colorMap = {
  primary: colors.primary,
  "primary-light": colors.primaryLight,
  navy: colors.navy,
  "brand-blue": colors.brandBlue,
  "on-surface": colors.onSurface,
  "on-surface-muted": colors.onSurfaceMuted,
  "dark-gray": colors.darkGray,
};

interface IconProps {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: IconSize | number;
  color?: IconColor | string;
  className?: string;
}

export function Icon({
  name,
  size = "md",
  color = "on-surface",
  className,
}: IconProps) {
  const resolvedSize = typeof size === "number" ? size : sizeMap[size];
  const resolvedColor =
    color in colorMap ? colorMap[color as IconColor] : color;

  return <Ionicons name={name} size={resolvedSize} color={resolvedColor} />;
}
