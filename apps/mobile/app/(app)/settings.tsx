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
  CameraIcon,
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
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { useAuthStore } from "@/src/stores/auth.store";

export default function SettingsScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const { signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const role = user?.role ?? "player";
  const r = roleConfig(role);

  // Children (players managed by a guardian) have profile/billing locked.
  const guardian = useGuardianControls(role === "player");
  const isChild = guardian.isManaged;
  const profileLocked = isChild && guardian.profileSettingsLocked;
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
    <DashboardLayout role={role} activeTab="settings">
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
              <View>
                <Avatar
                  role={role}
                  size={84}
                  initials={user.initials}
                  imageUrl={user.avatarUrl}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change photo"
                  onPress={() => router.push("/(app)/profile-settings")}
                  className="absolute -right-0.5 -bottom-0.5 h-[26px] w-[26px] items-center justify-center rounded-full border-[2.5px]"
                  style={{
                    backgroundColor: r.accent,
                    borderColor: colors.surface2,
                  }}>
                  <CameraIcon size={13} color="#fff" />
                </Pressable>
              </View>
              <Title className="mt-3.5 mb-0.5">{user.fullName}</Title>
              {user.username ? (
                <Meta style={{ color: r.accent }}>@{user.username}</Meta>
              ) : null}
            </View>

            {/* Subscription card */}
            <Pressable
              accessibilityRole="button"
              onPress={isChild ? () => setBillingLockOpen(true) : undefined}
              className="mx-5 mb-2 overflow-hidden rounded-2xl border opacity-[0.55]"
              style={{ borderColor: `${r.accent}30` }}>
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
                  color={r.accent}
                  size={40}
                  bgAlpha="22"
                  borderAlpha="40">
                  <ShieldIcon size={18} color={r.accent} />
                </IconTile>
                <View className="min-w-0 flex-1">
                  <MicroLabel className="mb-0.5" style={{ color: r.accent }}>
                    Current plan
                  </MicroLabel>
                  <Lead>{r.planName}</Lead>
                  <Caption className="text-text-secondary mt-px">
                    {isChild ? r.planSub : "Coming soon"}
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
                icon={<SettingsGearIcon size={18} color={r.accent} />}
                title="Profile settings"
                sub="Photo, name, username, bio, privacy"
                accent={r.accent}
                locked={profileLocked}
                onPress={() => router.push("/(app)/profile-settings")}
              />
              <MenuRow
                icon={<CreditIcon size={18} color={r.accent} />}
                title="Subscription & billing"
                sub={isChild ? "Managed by your guardian" : "Coming soon"}
                accent={r.accent}
                locked={isChild}
                comingSoon={!isChild}
                onPress={isChild ? () => setBillingLockOpen(true) : undefined}
              />
              <MenuRow
                icon={<LockIcon size={18} color={r.accent} />}
                title="Security"
                sub="Password, two-factor"
                accent={r.accent}
                onPress={() => router.push("/(app)/security")}
              />
            </View>

            {/* Preferences */}
            <SectionLabel title="Preferences" />
            <View className="gap-2 px-5">
              <MenuRow
                icon={<BellIcon size={18} color={r.accent} />}
                title="Notifications"
                sub="Coming soon"
                accent={r.accent}
                comingSoon
              />
            </View>

            {/* Support */}
            <SectionLabel title="Support" />
            <View className="gap-2 px-5">
              <MenuRow
                icon={<HelpIcon size={18} color={r.accent} />}
                title="Help & FAQs"
                sub="Coming soon"
                accent={r.accent}
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
                accent={r.accent}
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
