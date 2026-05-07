import { useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import { useAuthStore } from "@/src/stores/auth.store";
import { useChildren } from "@/src/hooks/useChildren";
import type { ChildSummary } from "@/src/services/parent.service";
import { Label, H3, Button } from "@/src/components/ui";
import { shadows } from "@/src/constants/theme";


function ChildCard({ child }: { child: ChildSummary }) {
  return (
    <View className="rounded-xl border border-border-subtle bg-white/[0.04] p-4 flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-full bg-brand-orange/15 items-center justify-center">
        <Text className="font-inter font-bold text-[14px] text-brand-orange">
          {child.firstName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-inter font-semibold text-[15px] text-text-primary">
          {child.firstName} {child.lastName}
        </Text>
        <Text className="font-inter text-[12px] text-text-tertiary">
          @{child.username}
        </Text>
      </View>
    </View>
  );
}

export default function ParentDashboard() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const { children, isLoading, refresh } = useChildren();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        <Label className="text-text-disabled mb-8">Parent dashboard</Label>

        <H3 style={{ marginBottom: 32 }}>
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </H3>

        <Button
          onPress={() => router.push("/(app)/parent/add-child")}
          className="w-full mb-8"
          size="lg"
          style={shadows.orangeGlow}
        >
          Add child
        </Button>

        <Label className="mb-3">My children</Label>

        {isLoading ? (
          <ActivityIndicator color="rgba(255,255,255,0.35)" style={{ marginTop: 16 }} />
        ) : children.length === 0 ? (
          <Text className="font-inter text-[14px] text-text-disabled text-center mt-4">
            No children added yet
          </Text>
        ) : (
          <View className="gap-2.5">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </View>
        )}
      </View>

      <View className="px-6 pb-4">
        <Button variant="secondary" onPress={signOut} className="w-full" size="lg">
          Log out
        </Button>
      </View>
    </SafeAreaView>
  );
}
