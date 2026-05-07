import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/src/stores/auth.store";
import { ROLES } from "@/src/constants/roles";
import type { RoleId } from "@/src/constants/roles";
import { Label, Button } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, primaryRole, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const roleConfig = primaryRole
    ? (ROLES.find((r) => r.id === (primaryRole as RoleId)) ?? ROLES[0])
    : null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  }

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        <Label className="text-text-disabled mb-8">Temporary dashboard</Label>

        {!profile ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={colors.brandOrange} />
          </View>
        ) : (
          <View className="gap-6">
            {/* Name */}
            <View className="gap-1">
              <Label>Name</Label>
              <Text className="font-inter font-extrabold text-[32px] tracking-[-0.96px] leading-[35.2px] text-text-primary">
                {profile.first_name} {profile.last_name}
              </Text>
              {profile.username ? (
                <Text className="font-inter text-[14px] text-text-tertiary">
                  @{profile.username}
                </Text>
              ) : null}
            </View>

            {/* Role */}
            <View className="gap-2">
              <Label>Role</Label>
              <View
                className="self-start rounded-full px-4 py-2 border"
                style={{
                  backgroundColor: roleConfig?.accentDim,
                  borderColor: roleConfig?.accentBorder,
                }}
              >
                <Text
                  className="font-inter font-bold text-[13px] tracking-[0.52px]"
                  style={{ color: roleConfig?.accent }}
                >
                  {roleConfig?.title}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Sign out */}
      <View className="px-6 pb-4">
        <Button
          variant="secondary"
          onPress={handleSignOut}
          disabled={signingOut}
          className="w-full"
          size="lg"
        >
          {signingOut ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            "Sign out"
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}
