import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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
  PinIcon,
  SettingsIcon as SettingsGearIcon,
  ShieldIcon,
} from "@/src/components/dashboard/icons";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { useAuthStore } from "@/src/stores/auth.store";

type MenuRowProps = {
  icon: ReactNode;
  title: string;
  sub?: string;
  accent: string;
  danger?: boolean;
  locked?: boolean;
  onPress?: () => void;
};

function MenuRow({
  icon,
  title,
  sub,
  accent,
  danger,
  locked,
  onPress,
}: MenuRowProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
        opacity: locked ? 0.55 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: danger ? "rgba(229,62,62,0.10)" : `${accent}14`,
          borderWidth: 1,
          borderColor: danger ? "rgba(229,62,62,0.25)" : `${accent}30`,
          alignItems: "center",
          justifyContent: "center",
        }}>
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14.5,
            fontWeight: "600",
            color: danger ? colors.danger : colors.textPrimary,
            marginBottom: sub ? 2 : 0,
          }}>
          {title}
        </Text>
        {sub ? (
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 12,
              color: colors.textTertiary,
            }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {locked ? (
        <LockIcon size={16} color={colors.textTertiary} />
      ) : (
        <ChevronIcon size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 }}>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 11 * 0.13,
          color: colors.textSecondary,
          textTransform: "uppercase",
        }}>
        {title}
      </Text>
    </View>
  );
}

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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 6,
            paddingBottom: 28,
          }}>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 22,
              fontWeight: "900",
              color: colors.textPrimary,
              letterSpacing: -22 * 0.03,
            }}>
            Profile
          </Text>
        </View>

        {user ? (
          <>
            {/* Identity card */}
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 18,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: 18,
                padding: 22,
                alignItems: "center",
                overflow: "hidden",
              }}>
              <LinearGradient
                colors={[`${r.accent}22`, "transparent"]}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                }}
              />
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
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: r.accent,
                    borderWidth: 2.5,
                    borderColor: colors.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <CameraIcon size={13} color="#fff" />
                </Pressable>
              </View>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 20,
                  fontWeight: "800",
                  color: colors.textPrimary,
                  letterSpacing: -20 * 0.02,
                  marginTop: 14,
                  marginBottom: 3,
                }}>
                {user.fullName}
              </Text>
              {user.username ? (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    fontWeight: "600",
                    color: r.accent,
                    letterSpacing: 12 * 0.06,
                  }}>
                  @{user.username}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                {user.regionName ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: 999,
                    }}>
                    <PinIcon size={10} color={colors.textTertiary} />
                    <Text
                      style={{
                        fontFamily: "Inter",
                        fontSize: 11,
                        fontWeight: "600",
                        color: colors.textSecondary,
                      }}>
                      {user.regionName}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: `${r.accent}14`,
                    borderWidth: 1,
                    borderColor: `${r.accent}30`,
                    borderRadius: 999,
                  }}>
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 10,
                      fontWeight: "700",
                      color: r.accent,
                      letterSpacing: 10 * 0.1,
                      textTransform: "uppercase",
                    }}>
                    {r.shortLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Subscription card */}
            <Pressable
              accessibilityRole="button"
              onPress={isChild ? () => setBillingLockOpen(true) : undefined}
              style={{
                marginHorizontal: 20,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: `${r.accent}30`,
                borderRadius: 14,
                overflow: "hidden",
                opacity: isChild ? 0.55 : 1,
              }}>
              <LinearGradient
                colors={[`${r.accent}12`, colors.surface2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: `${r.accent}22`,
                    borderWidth: 1,
                    borderColor: `${r.accent}40`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <ShieldIcon size={18} color={r.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 9.5,
                      fontWeight: "700",
                      letterSpacing: 9.5 * 0.13,
                      color: r.accent,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}>
                    Current plan
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 15,
                      fontWeight: "800",
                      color: colors.textPrimary,
                    }}>
                    {r.planName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 11.5,
                      color: colors.textSecondary,
                      marginTop: 1,
                    }}>
                    {r.planSub}
                  </Text>
                </View>
                <ChevronIcon size={16} color={colors.textTertiary} />
              </LinearGradient>
            </Pressable>

            {/* Account */}
            <SectionHead title="Account" />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
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
                sub={
                  isChild
                    ? "Managed by your guardian"
                    : `${r.planName} · Manage plan`
                }
                accent={r.accent}
                locked={isChild}
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
            <SectionHead title="Preferences" />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              <MenuRow
                icon={<BellIcon size={18} color={r.accent} />}
                title="Notifications"
                sub="Push, email, SMS"
                accent={r.accent}
              />
            </View>

            {/* Support */}
            <SectionHead title="Support" />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              <MenuRow
                icon={<HelpIcon size={18} color={r.accent} />}
                title="Help & FAQs"
                accent={r.accent}
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

            <Text
              style={{
                paddingTop: 24,
                paddingHorizontal: 20,
                textAlign: "center",
                fontFamily: "Inter",
                fontSize: 11,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: 11 * 0.04,
              }}>
              Hooper · v1.0.0
            </Text>
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
