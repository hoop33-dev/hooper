import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1A1718" },
        animation: "none",
      }}
    >
      <Stack.Screen
        name="profile-settings"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="billing"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
