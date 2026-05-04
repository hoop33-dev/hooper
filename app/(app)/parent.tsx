import { useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { styled } from "nativewind";

import { useAuthStore } from "@/src/stores/auth.store";
import { useChildren } from "@/src/hooks/useChildren";
import type { ChildSummary } from "@/src/services/parent.service";
import { Label, H3, Button } from "@/src/components/ui";
import { colors, shadows } from "@/src/constants/theme";

const StyledSafeAreaView = styled(SafeAreaView);

function ChildCard({ child }: { child: ChildSummary }) {
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(241,88,37,0.15)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "700",
            fontSize: 14,
            color: colors.brandOrange,
          }}
        >
          {child.firstName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "600",
            fontSize: 15,
            color: colors.textPrimary,
          }}
        >
          {child.firstName} {child.lastName}
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: colors.textTertiary,
          }}
        >
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
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
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
          <ActivityIndicator
            color={colors.textTertiary}
            style={{ marginTop: 16 }}
          />
        ) : children.length === 0 ? (
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              color: colors.textDisabled,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            No children added yet
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
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
    </StyledSafeAreaView>
  );
}
