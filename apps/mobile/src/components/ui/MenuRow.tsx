import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";

import { ChevronIcon, LockIcon } from "@/src/components/dashboard/icons";
import { colors } from "@/src/constants/theme";

import { IconTile } from "./IconTile";
import { Caption, RowTitle } from "./Typography";

type MenuRowProps = {
  icon: ReactNode;
  title: string;
  sub?: string;
  /** Accent colour for the icon tile (hex). */
  accent: string;
  /** Render the row in the danger palette (e.g. "Sign out"). */
  danger?: boolean;
  /** Dim the row and show a lock instead of a chevron. */
  locked?: boolean;
  /** Dim the row and hide the trailing affordance. */
  comingSoon?: boolean;
  onPress?: () => void;
};

/**
 * A tappable settings/navigation row: accent icon tile, title, optional
 * subtitle, and a trailing chevron / lock. Used across settings and
 * security; previously copy-pasted with inline styles in each.
 */
export function MenuRow({
  icon,
  title,
  sub,
  accent,
  danger = false,
  locked = false,
  comingSoon = false,
  onPress,
}: MenuRowProps) {
  const [pressed, setPressed] = useState(false);
  const dimmed = locked || comingSoon;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="border-border-subtle bg-surface-2 flex-row items-center gap-3.5 rounded-2xl border px-4 py-3.5"
      style={{
        opacity: dimmed ? 0.55 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      }}>
      <IconTile color={danger ? colors.danger : accent}>{icon}</IconTile>
      <View className="min-w-0 flex-1">
        <RowTitle className={danger ? "text-danger" : ""}>{title}</RowTitle>
        {sub ? <Caption className="mt-0.5">{sub}</Caption> : null}
      </View>
      {locked ? (
        <LockIcon size={16} color={colors.textTertiary} />
      ) : comingSoon ? null : (
        <ChevronIcon size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}
