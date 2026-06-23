import { Text, View } from "react-native";

import { DashboardLayout } from "@/src/components/dashboard";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { colors, fonts} from "@/src/constants/theme";

export default function ChatScreen() {
  const user = useDashboardUser();
  const role = user?.role ?? "player";

  return (
    <DashboardLayout role={role} activeTab="chat">
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontSize: 22,
            color: colors.textPrimary,
            letterSpacing: -22 * 0.02,
            marginBottom: 8,
          }}
        >
          Chat
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.textTertiary,
            textAlign: "center",
          }}
        >
          Coming soon.
        </Text>
      </View>
    </DashboardLayout>
  );
}
