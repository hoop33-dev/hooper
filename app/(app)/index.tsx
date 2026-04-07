import { View } from "react-native";
import { Text } from "@/src/components/ui";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";

export default function AppHome() {
  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-muted">Welcome to Hoop 33</Text>
      </View>
    </StyledSafeAreaView>
  );
}
