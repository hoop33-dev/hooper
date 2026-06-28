import { ScrollView, View } from "react-native";

import { DashboardHeader, DashboardLayout } from "@/src/components/dashboard";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";

export default function PlayerDashboard() {
  const user = useDashboardUser();

  return (
    <DashboardLayout role="player" activeTab="dashboard">
      {user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <DashboardHeader
            role="player"
            firstName={user.firstName}
            initials={user.initials}
            imageUrl={user.avatarUrl}
          />
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}
    </DashboardLayout>
  );
}
