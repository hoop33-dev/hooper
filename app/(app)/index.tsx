import { View } from "react-native";
import { useRouter } from "expo-router";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import { Button, Text } from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";

export default function AppHome() {
  const router = useRouter();

  async function handleLogOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-on-surface-muted">Welcome to Hoop 33</Text>
        <Button
          variant="outline"
          iconLeft="log-out"
          onPress={() => void handleLogOut()}
        >
          Log Out
        </Button>
      </View>
    </StyledSafeAreaView>
  );
}
