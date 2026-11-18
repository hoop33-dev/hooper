import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import {
  Avatar,
  DashboardLayout,
  GuardianLockPopup,
} from "@/src/components/dashboard";
import {
  BellIcon,
  ChevronIcon,
  CreditIcon,
  HelpIcon,
  LockIcon,
  LogoutIcon,
  SettingsIcon as SettingsGearIcon,
  ShieldIcon,
} from "@/src/components/dashboard/icons";
import {
  Caption,
  IconTile,
  Lead,
  MenuRow,
  Meta,
  MicroLabel,
  ScreenTitle,
  SectionLabel,
  Title,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { useAuthStore } from "@/src/stores/auth.store";

export default function SettingsScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const { signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const accent = colors.brandOrange;

  // Children (players managed by a guardian) have billing locked.
  const guardian = useGuardianControls();
  const isChild = guardian.isManaged;
  const [billingLockOpen, setBillingLockOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DashboardLayout activeTab="settings">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Title bar */}
        <View className="flex-row items-center justify-between px-5 pt-1.5 pb-7">
          <ScreenTitle>Profile</ScreenTitle>
        </View>

        {user ? (
          <>
            {/* Identity card */}
            <View className="bg-surface-2 border-border-subtle mx-5 mb-5 items-center overflow-hidden rounded-[18px] border p-5">
              <Avatar
                size={84}
                initials={user.initials}
                imageUrl={user.avatarUrl}
              />
              <Title className="mt-3.5 mb-0.5">{user.fullName}</Title>
              {user.username ? (
                <Meta style={{ color: accent }}>@{user.username}</Meta>
              ) : null}
            </View>

            {/* Subscription card */}
            <Pressable
              accessibilityRole="button"
              onPress={isChild ? () => setBillingLockOpen(true) : undefined}
              className="mx-5 mb-2 overflow-hidden rounded-2xl border opacity-[0.55]"
              style={{ borderColor: `${accent}30` }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: colors.surface2,
                }}>
                <IconTile
                  color={accent}
                  size={40}
                  bgAlpha="22"
                  borderAlpha="40">
                  <ShieldIcon size={18} color={accent} />
                </IconTile>
                <View className="min-w-0 flex-1">
                  <MicroLabel className="mb-0.5" style={{ color: accent }}>
                    Current plan
                  </MicroLabel>
                  <Lead>Level 1</Lead>
                  <Caption className="text-text-secondary mt-px">
                    {isChild ? "Standard access · No coach" : "Coming soon"}
                  </Caption>
                </View>
                {isChild ? (
                  <ChevronIcon size={16} color={colors.textTertiary} />
                ) : null}
              </View>
            </Pressable>

            {/* Account */}
            <SectionLabel title="Account" />
            <View className="gap-2 px-5">
              <MenuRow
                icon={<SettingsGearIcon size={18} color={accent} />}
                title="Profile settings"
                sub="View your profile details"
                accent={accent}
                onPress={() => router.push("/(app)/profile-settings")}
              />
              <MenuRow
                icon={<CreditIcon size={18} color={accent} />}
                title="Subscription & billing"
                sub={isChild ? "Managed by your guardian" : "Coming soon"}
                accent={accent}
                locked={isChild}
                comingSoon={!isChild}
                onPress={isChild ? () => setBillingLockOpen(true) : undefined}
              />
              <MenuRow
                icon={<LockIcon size={18} color={accent} />}
                title="Security"
                sub="Password, two-factor"
                accent={accent}
                onPress={() => router.push("/(app)/security")}
              />
            </View>

            {/* Preferences */}
            <SectionLabel title="Preferences" />
            <View className="gap-2 px-5">
              <MenuRow
                icon={<BellIcon size={18} color={accent} />}
                title="Notifications"
                sub="Coming soon"
                accent={accent}
                comingSoon
              />
            </View>

            {/* Support */}
            <SectionLabel title="Support" />
            <View className="gap-2 px-5">
              <MenuRow
                icon={<HelpIcon size={18} color={accent} />}
                title="Help & FAQs"
                sub="Coming soon"
                accent={accent}
                comingSoon
              />
              <MenuRow
                icon={
                  signingOut ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <LogoutIcon size={18} color={colors.danger} />
                  )
                }
                title="Sign out"
                accent={accent}
                danger
                onPress={signingOut ? undefined : handleSignOut}
              />
            </View>

            <Caption className="text-text-disabled px-5 pt-6 text-center">
              Hooper · v1.0.0
            </Caption>
          </>
        ) : (
          <ActivityIndicator
            color={colors.textTertiary}
            style={{ marginTop: 40 }}
          />
        )}
      </ScrollView>
      <GuardianLockPopup
        visible={billingLockOpen}
        onClose={() => setBillingLockOpen(false)}
        kind="billing"
      />
    </DashboardLayout>
  );
}
