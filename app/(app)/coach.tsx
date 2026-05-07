import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

import { useAuthStore } from "@/src/stores/auth.store";
import { Label, H3, Button } from "@/src/components/ui";

const StyledSafeAreaView = styled(SafeAreaView);

export default function CoachDashboard() {
  const { profile, signOut } = useAuthStore();

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        <Label className="text-text-disabled mb-8">Coach dashboard</Label>

        <H3>
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </H3>
      </View>

      <View className="px-6 pb-4">
        <Button variant="secondary" onPress={signOut} className="w-full" size="lg">
          Log out
        </Button>
      </View>
    </StyledSafeAreaView>
  );
}
