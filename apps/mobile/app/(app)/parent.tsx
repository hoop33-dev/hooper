import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import {
  Avatar,
  DashboardHeader,
  DashboardLayout,
} from "@/src/components/dashboard";
import { EyeIcon, PlusIcon } from "@/src/components/dashboard/icons";
import {
  Caption,
  IconTile,
  Lead,
  Meta,
  Overline,
  Pill,
  TabLabel,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useChildren } from "@/src/hooks/useChildren";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import type { ChildSummary } from "@/src/services/parent.service";

const PARENT_ACCENT = roleConfig("parent").accent;

function ViewAsButton({
  firstName,
  onPress,
}: {
  firstName: string;
  onPress: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View as ${firstName}`}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Pill
        color={PARENT_ACCENT}
        icon={<EyeIcon size={12} color={PARENT_ACCENT} />}>
        <Meta style={{ color: PARENT_ACCENT }}>View as</Meta>
      </Pill>
    </Pressable>
  );
}

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
        <ViewAsButton
          firstName={child.firstName}
          onPress={(e) => {
            e.stopPropagation();
            onViewAs();
          }}
        />
      </View>
    </Pressable>
  );
}

function AddChildButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-1.5 flex-row items-center justify-center gap-2.5 rounded-2xl py-4"
      style={({ pressed }) => ({
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: `${PARENT_ACCENT}55`,
        opacity: pressed ? 0.7 : 1,
      })}>
      <IconTile
        color={PARENT_ACCENT}
        size={32}
        radius={16}
        bgAlpha="20"
        borderAlpha="45">
        <PlusIcon size={16} color={PARENT_ACCENT} />
      </IconTile>
      <TabLabel style={{ color: PARENT_ACCENT }}>Add another child</TabLabel>
    </Pressable>
  );
}

function ChildrenSection({
  items,
  isLoading,
  onManage,
  onViewAs,
  onAdd,
}: {
  items: ChildSummary[];
  isLoading: boolean;
  onManage: (child: ChildSummary) => void;
  onViewAs: (child: ChildSummary) => void;
  onAdd: () => void;
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
              onManage={() => onManage(child)}
              onViewAs={() => onViewAs(child)}
            />
          ))}
          <AddChildButton onPress={onAdd} />
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
            onManage={manageChild}
            onViewAs={viewAsChild}
            onAdd={() => router.push("/(app)/parent/add-child")}
          />
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}
    </DashboardLayout>
  );
}
