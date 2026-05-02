import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

export default function CoachDashboard() {
  const { profile, signOut } = useAuthStore();

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 10 * 0.14,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: 32,
          }}
        >
          Coach dashboard
        </Text>

        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "900",
            fontSize: 32,
            letterSpacing: 32 * -0.03,
            lineHeight: 32 * 1.1,
            color: "#FFFFFF",
          }}
        >
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <Pressable
          onPress={signOut}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 15,
              letterSpacing: 15 * 0.08,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Log out
          </Text>
        </Pressable>
      </View>
    </StyledSafeAreaView>
  );
}
