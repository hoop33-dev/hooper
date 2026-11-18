import { Pressable, View } from "react-native";

import { Caption, Title } from "@/src/components/ui/Typography";
import { colors } from "@/src/constants/theme";

import { Avatar } from "./Avatar";
import { BellIcon } from "./icons";

type DashboardHeaderProps = {
  firstName: string;
  initials: string;
  imageUrl?: string | null;
  onPressBell?: () => void;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  firstName,
  initials,
  imageUrl,
  onPressBell,
}: DashboardHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-5 pt-1.5 pb-[22px]">
      <Avatar size={42} initials={initials} imageUrl={imageUrl} />
      <View className="min-w-0 flex-1">
        <Caption className="mb-0.5">{greeting()},</Caption>
        <Title numberOfLines={1}>{firstName}</Title>
      </View>
      {/* Notifications aren't built yet — shown greyed out and inert, with no
       * unread dot, until they are. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        accessibilityState={{ disabled: true }}
        disabled
        onPress={onPressBell}
        className="border-border-subtle bg-surface-2 h-10 w-10 items-center justify-center rounded-full border"
        style={{ opacity: 0.5 }}>
        <BellIcon size={18} color={colors.textDisabled} />
      </Pressable>
    </View>
  );
}
