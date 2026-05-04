import "../global.css";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { useAuthStore } from "@/src/stores/auth.store";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../assets/fonts/Inter.ttf"),
  });

  const { status, primaryRole, session, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments() as string[];

  // Hydrate auth state once on mount
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Route guard
  useEffect(() => {
    if (status === "loading") return;

    const inAuth = segments[0] === "(auth)";
    const inApp = segments[0] === "(app)";
    const inRoot = !inAuth && !inApp;
    const inVerify = inAuth && segments[1] === "verify-email";

    if (status === "unauthenticated") {
      if (!inRoot && !inAuth) {
        router.replace("/");
      }
      return;
    }

    if (status === "needs_verification") {
      if (!inVerify) {
        router.replace("/(auth)/verify-email");
      }
      return;
    }

    if (status === "authenticated") {
      // Fall back to session user_metadata when profile hasn't loaded yet.
      // This prevents defaulting to "player" while primaryRole is still null.
      const role = (primaryRole ??
        (session?.user?.user_metadata?.role as import("@/src/types/database.types").RoleType | undefined)) ?? null;

      // Don't redirect until we know the role — avoids landing on the wrong dashboard.
      if (!role) return;

      if (inRoot || inAuth) {
        router.replace(`/(app)/${role}` as `/(app)/${typeof role}`);
        return;
      }
      // Prevent a user from staying on another role's dashboard
      if (inApp && segments[1] !== role && segments[1] !== "parent") {
        router.replace(`/(app)/${role}` as `/(app)/${typeof role}`);
      }
    }
  }, [status, segments, primaryRole, session]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (status === "loading") {
    return null;
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider style={{ backgroundColor: "#1A1718" }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#1A1718" },
          }}
        />
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
