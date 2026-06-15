import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import {
  Avatar,
  DashboardHeader,
  DashboardLayout,
} from "@/src/components/dashboard";
import { EyeIcon, PlusIcon } from "@/src/components/dashboard/icons";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useChildren } from "@/src/hooks/useChildren";
import type { ChildSummary } from "@/src/services/parent.service";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";

const PARENT_ACCENT = roleConfig("parent").accent;

function ChildCard({
  child,
  onManage,
  onViewAs,
}: {
  child: ChildSummary;
  onManage: () => void;
  onViewAs: () => void;
}) {
  const initials =
    (child.firstName.charAt(0) + child.lastName.charAt(0)).toUpperCase() || "?";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Manage ${child.firstName}`}
      onPress={onManage}
      style={({ pressed }) => ({
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 16,
        padding: 14,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar role="player" size={50} initials={initials} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              marginBottom: 3,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "800",
                color: colors.textPrimary,
                letterSpacing: -15 * 0.02,
              }}
            >
              {child.firstName}
            </Text>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.success,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 11.5,
              color: colors.textSecondary,
            }}
          >
            @{child.username}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View as ${child.firstName}`}
          onPress={(e) => {
            e.stopPropagation();
            onViewAs();
          }}
          hitSlop={6}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: `${PARENT_ACCENT}18`,
            borderWidth: 1,
            borderColor: `${PARENT_ACCENT}40`,
            borderRadius: 999,
            flexShrink: 0,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <EyeIcon size={12} color={PARENT_ACCENT} />
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 11.5,
              fontWeight: "700",
              color: PARENT_ACCENT,
            }}
          >
            View as
          </Text>
        </Pressable>
      </View>
    </Pressable>
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

  function manageChild(child: ChildSummary) {
    router.push({
      pathname: "/(app)/parent/manage-child",
      params: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        username: child.username,
      },
    });
  }

  function viewAsChild(child: ChildSummary) {
    router.push({
      pathname: "/(app)/parent/view-as-child",
      params: { id: child.id, firstName: child.firstName },
    });
  }

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
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 11 * 0.13,
                color: colors.textSecondary,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Your children
            </Text>

            {isLoading ? (
              <ActivityIndicator
                color={colors.textTertiary}
                style={{ marginTop: 8 }}
              />
            ) : (
              <>
                {children.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onManage={() => manageChild(child)}
                    onViewAs={() => viewAsChild(child)}
                  />
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(app)/parent/add-child")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    backgroundColor: "transparent",
                    borderWidth: 1.5,
                    borderColor: `${PARENT_ACCENT}55`,
                    borderStyle: "dashed",
                    borderRadius: 14,
                    paddingVertical: 16,
                    marginTop: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: `${PARENT_ACCENT}20`,
                      borderWidth: 1,
                      borderColor: `${PARENT_ACCENT}45`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlusIcon size={16} color={PARENT_ACCENT} />
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 14,
                      fontWeight: "700",
                      color: PARENT_ACCENT,
                    }}
                  >
                    Add another child
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
