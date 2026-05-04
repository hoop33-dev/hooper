import { useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { styled } from "nativewind";

import { useAuthStore } from "@/src/stores/auth.store";
import { useChildren } from "@/src/hooks/useChildren";
import type { ChildSummary } from "@/src/services/parent.service";

const StyledSafeAreaView = styled(SafeAreaView);

function ChildCard({ child }: { child: ChildSummary }) {
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
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
            color: "#F15825",
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
            color: "#FFFFFF",
          }}
        >
          {child.firstName} {child.lastName}
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
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
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 10 * 0.14,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: 32,
          }}
        >
          Parent dashboard
        </Text>

        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "900",
            fontSize: 32,
            letterSpacing: 32 * -0.03,
            lineHeight: 32 * 1.1,
            color: "#FFFFFF",
            marginBottom: 32,
          }}
        >
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </Text>

        {/* Add child */}
        <Pressable
          onPress={() => router.push("/(app)/parent/add-child")}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#F15825",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            shadowColor: "#F15825",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 6,
            marginBottom: 32,
          })}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 15,
              letterSpacing: 15 * 0.08,
              textTransform: "uppercase",
              color: "#000000",
            }}
          >
            Add child
          </Text>
        </Pressable>

        {/* Children list */}
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 10 * 0.12,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 12,
          }}
        >
          My children
        </Text>

        {isLoading ? (
          <ActivityIndicator color="rgba(255,255,255,0.4)" style={{ marginTop: 16 }} />
        ) : children.length === 0 ? (
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              color: "rgba(255,255,255,0.3)",
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
        <Pressable
          onPress={signOut}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 15,
              letterSpacing: 15 * 0.08,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Log out
          </Text>
        </Pressable>
      </View>
    </StyledSafeAreaView>
  );
}
