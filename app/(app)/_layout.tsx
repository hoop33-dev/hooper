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
        name="security"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="security-verify"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="security-new-password"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="parent/manage-child"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="parent/view-as-child"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
