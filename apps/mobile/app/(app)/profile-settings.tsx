import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { Avatar } from "@/src/components/dashboard";
import { LockIcon } from "@/src/components/dashboard/icons";
import {
  Caption,
  IconTile,
  Lead,
  Meta,
  Overline,
  ScreenHeader,
  Title,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <View
      className={`border-border-subtle bg-surface-2 rounded-2xl border px-4 py-3 ${className ?? ""}`}>
      <Caption className="text-text-tertiary mb-0.5">{label}</Caption>
      <Lead>{value}</Lead>
    </View>
  );
}

/**
 * Read-only view of the signed-in user's profile. Profile details are managed
 * in the billing portal, so nothing here is editable.
 */
export default function ProfileSettingsScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const r = roleConfig(user?.role ?? "player");

  return (
    <View className="bg-surface flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1">
        <ScreenHeader
          title="Profile settings"
          backLabel="Profile"
          onBack={() => router.back()}
        />

        {/* Can't-edit notice */}
        <View className="border-border-subtle bg-surface-2 mx-5 mt-2 flex-row items-center gap-3.5 rounded-2xl border p-4">
          <IconTile color={r.accent} size={40} bgAlpha="22" borderAlpha="40">
            <LockIcon size={18} color={r.accent} />
          </IconTile>
          <View className="min-w-0 flex-1">
            <Lead>You can&apos;t change this here</Lead>
            <Caption className="text-text-secondary mt-0.5">
              Your profile details are managed elsewhere.
            </Caption>
          </View>
        </View>

        {user ? (
          // Greyed out: everything below is read-only (managed in the portal).
          <View style={{ opacity: 0.5 }} pointerEvents="none">
            <View className="items-center px-5 py-7">
              <Avatar
                role={user.role}
                size={92}
                initials={user.initials}
                imageUrl={user.avatarUrl}
              />
              <Title className="mt-3.5 mb-0.5">{user.fullName}</Title>
              {user.username ? (
                <Meta style={{ color: r.accent }}>@{user.username}</Meta>
              ) : null}
            </View>

            <View className="px-5">
              <Overline className="mb-3.5">Details</Overline>
              <View className="gap-2">
                <View className="flex-row gap-2">
                  <DetailRow
                    label="First name"
                    value={user.firstName || "—"}
                    className="flex-1"
                  />
                  <DetailRow
                    label="Last name"
                    value={user.lastName || "—"}
                    className="flex-1"
                  />
                </View>
                <DetailRow
                  label="Username"
                  value={user.username ? `@${user.username}` : "—"}
                />
                <DetailRow label="Region" value={user.regionName ?? "—"} />
                {user.bio ? <DetailRow label="Bio" value={user.bio} /> : null}
              </View>
            </View>
          </View>
        ) : (
          <ActivityIndicator
            color={colors.textTertiary}
            style={{ marginTop: 40 }}
          />
        )}
      </ScrollView>
    </View>
  );
}
