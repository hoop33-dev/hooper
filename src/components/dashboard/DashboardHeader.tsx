import { Pressable, Text, View } from "react-native";

import { roleConfig, type RoleId } from "@/src/constants/roles";
import { colors, fonts } from "@/src/constants/theme";

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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 22,
        gap: 12,
      }}>
      <Avatar role={role} size={42} initials={initials} imageUrl={imageUrl} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 11.5,
            color: colors.textTertiary,
            fontWeight: "500",
            letterSpacing: 11.5 * 0.04,
            marginBottom: 2,
          }}>
          {greeting()},
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            fontWeight: "800",
            color: colors.textPrimary,
            letterSpacing: -18 * 0.02,
            lineHeight: 18 * 1.1,
          }}>
          {firstName}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={onPressBell}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surface2,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <BellIcon size={18} color={colors.textSecondary} />
        <View
          style={{
            position: "absolute",
            top: 9,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: r.accent,
            borderWidth: 2,
            borderColor: colors.surface2,
          }}
        />
      </Pressable>
    </View>
  );
}
