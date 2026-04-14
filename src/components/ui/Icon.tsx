import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  Heart,
  Link,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Search,
  Share2,
  Star,
  Trophy,
  UserCircle,
  XCircle,
  Zap,
} from "lucide-react-native";
import { colors } from "@/src/constants/theme";

const iconMap = {
  "arrow-left": ArrowLeft,
  basketball: CircleDot,
  calendar: Calendar,
  check: Check,
  "check-circle": CheckCircle,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  clock: Clock,
  dumbbell: Dumbbell,
  eye: Eye,
  "eye-off": EyeOff,
  heart: Heart,
  link: Link,
  loader: Loader2,
  lock: Lock,
  "log-out": LogOut,
  plus: Plus,
  search: Search,
  share: Share2,
  star: Star,
  trophy: Trophy,
  "user-circle": UserCircle,
  "x-circle": XCircle,
  zap: Zap,
} as const;

export type IconName = keyof typeof iconMap;

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
  "on-surface": colors.onSurface,
  "on-surface-muted": colors.onSurfaceMuted,
};

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: IconColor | string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = "md",
  color = "on-surface",
  strokeWidth = 2,
}: IconProps) {
  const LucideIcon = iconMap[name];
  const resolvedSize = typeof size === "number" ? size : sizeMap[size];
  const resolvedColor =
    color in colorMap ? colorMap[color as IconColor] : color;

  return (
    <LucideIcon
      size={resolvedSize}
      color={resolvedColor}
      strokeWidth={strokeWidth}
    />
  );
}
