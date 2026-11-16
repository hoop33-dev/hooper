import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import {
  Avatar,
  DashboardHeader,
  DashboardLayout,
} from "@/src/components/dashboard";
import { EyeIcon } from "@/src/components/dashboard/icons";
import { Caption, Lead, Meta, Overline, Pill } from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useChildren } from "@/src/hooks/useChildren";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import type { ChildSummary } from "@/src/services/parent.service";

const PARENT_ACCENT = roleConfig("parent").accent;

function ViewAsPill() {
  return (
    <Pill
      color={PARENT_ACCENT}
      icon={<EyeIcon size={12} color={PARENT_ACCENT} />}>
      <Meta style={{ color: PARENT_ACCENT }}>View as</Meta>
    </Pill>
  );
}

function ChildCard({
  child,
  onViewAs,
}: {
  child: ChildSummary;
  onViewAs: () => void;
}) {
  const initials =
    (child.firstName.charAt(0) + child.lastName.charAt(0)).toUpperCase() || "?";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View as ${child.firstName}`}
      onPress={onViewAs}
      className="border-border-subtle bg-surface-2 rounded-2xl border p-3.5"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <View className="flex-row items-center gap-3">
        <Avatar
          role="player"
          size={50}
          initials={initials}
          imageUrl={child.avatarUrl}
        />
        <View className="min-w-0 flex-1">
          <View className="mb-0.5 flex-row items-center gap-1.5">
            <Lead>{child.firstName}</Lead>
            <View className="bg-success h-[7px] w-[7px] rounded-full" />
          </View>
          <Caption className="text-text-secondary">@{child.username}</Caption>
        </View>
        <ViewAsPill />
      </View>
    </Pressable>
  );
}

function ChildrenSection({
  items,
  isLoading,
  onViewAs,
}: {
  items: ChildSummary[];
  isLoading: boolean;
  onViewAs: (child: ChildSummary) => void;
}) {
  return (
    <View className="gap-2.5 px-5">
      <Overline className="mb-0.5">Your children</Overline>

      {isLoading ? (
        <ActivityIndicator
          color={colors.textTertiary}
          style={{ marginTop: 8 }}
        />
      ) : (
        <>
          {items.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onViewAs={() => onViewAs(child)}
            />
          ))}
          <Caption className="text-text-tertiary mt-1 text-center">
            {items.length === 0
              ? "No children yet. Add them in the Hooper billing portal."
              : "Add or edit children in the Hooper billing portal."}
          </Caption>
        </>
      )}
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

  function viewAsChild(child: ChildSummary) {
    router.push({
      pathname: "/(app)/parent/view-as-child",
      params: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        username: child.username,
      },
    });
  }

  return (
    <DashboardLayout role="parent" activeTab="dashboard">
      {user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <DashboardHeader
            role="parent"
            firstName={user.firstName}
            initials={user.initials}
            imageUrl={user.avatarUrl}
          />
          <ChildrenSection
            items={children}
            isLoading={isLoading}
            onViewAs={viewAsChild}
          />
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}
    </DashboardLayout>
  );
}
