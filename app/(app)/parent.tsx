import { ScrollView, View } from "react-native";

import { DashboardHeader, DashboardLayout } from "@/src/components/dashboard";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";

export default function ParentDashboard() {
  const user = useDashboardUser();

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
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </DashboardLayout>
  );
}
