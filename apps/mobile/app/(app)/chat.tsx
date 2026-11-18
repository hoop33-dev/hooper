import { View } from "react-native";

import { DashboardLayout } from "@/src/components/dashboard";
import { BodySm, Title } from "@/src/components/ui";

export default function ChatScreen() {
  return (
    <DashboardLayout activeTab="chat">
      <View className="flex-1 items-center justify-center px-8">
        <Title className="mb-2">Chat</Title>
        <BodySm className="text-text-tertiary text-center">Coming soon.</BodySm>
      </View>
    </DashboardLayout>
  );
}
