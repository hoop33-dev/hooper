import { Pressable, View } from "react-native";

import { Caption, Title } from "@/src/components/ui/Typography";
import { roleConfig, type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";

import { Avatar } from "./Avatar";
import { BellIcon } from "./icons";

type DashboardHeaderProps = {
  role: RoleId;
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
  role,
  firstName,
  initials,
  imageUrl,
  onPressBell,
}: DashboardHeaderProps) {
  const r = roleConfig(role);
  return (
    <View className="flex-row items-center gap-3 px-5 pt-1.5 pb-[22px]">
      <Avatar role={role} size={42} initials={initials} imageUrl={imageUrl} />
      <View className="min-w-0 flex-1">
        <Caption className="mb-0.5">{greeting()},</Caption>
        <Title numberOfLines={1}>{firstName}</Title>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={onPressBell}
        className="border-border-subtle bg-surface-2 h-10 w-10 items-center justify-center rounded-full border">
        <BellIcon size={18} color={colors.textSecondary} />
        <View
          className="absolute top-[9px] right-2.5 h-2 w-2 rounded-full border-2"
          style={{ backgroundColor: r.accent, borderColor: colors.surface2 }}
        />
      </Pressable>
    </View>
  );
}
