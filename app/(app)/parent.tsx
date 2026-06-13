import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { DashboardHeader, DashboardLayout } from "@/src/components/dashboard";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useChildren } from "@/src/hooks/useChildren";
import type { ChildSummary } from "@/src/services/parent.service";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";

const PARENT_ACCENT = roleConfig("parent").accent;

function ChildRow({ child }: { child: ChildSummary }) {
  const initials =
    (child.firstName.charAt(0) + child.lastName.charAt(0)).toUpperCase() || "?";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: `${PARENT_ACCENT}18`,
          borderWidth: 1,
          borderColor: `${PARENT_ACCENT}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "800",
            fontSize: 14,
            color: PARENT_ACCENT,
          }}
        >
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "600",
            fontSize: 14,
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
  const user = useDashboardUser();
  const { children, isLoading, refresh } = useChildren();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <DashboardLayout role="parent" activeTab="dashboard">
      {user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <DashboardHeader
            role="parent"
            firstName={user.firstName}
            initials={user.initials}
          />

          {/* Children section */}
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 11 * 0.13,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                }}
              >
                My athletes
              </Text>
            </View>

            {isLoading ? (
              <ActivityIndicator
                color={colors.textTertiary}
                style={{ marginTop: 8 }}
              />
            ) : (
              <>
                {children.map((child) => (
                  <ChildRow key={child.id} child={child} />
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(app)/parent/add-child")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: `${PARENT_ACCENT}14`,
                    borderWidth: 1.5,
                    borderColor: `${PARENT_ACCENT}40`,
                    borderStyle: "dashed",
                    borderRadius: 14,
                    paddingVertical: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 14,
                      fontWeight: "700",
                      color: PARENT_ACCENT,
                    }}
                  >
                    + Add athlete
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </DashboardLayout>
  );
}
