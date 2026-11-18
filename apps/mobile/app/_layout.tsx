import "../global.css";

import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { useAuthStore } from "@/src/stores/auth.store";

SplashScreen.preventAutoHideAsync().catch(() => {});

// One registered family per weight — React Native can't reliably vary a single
// variable font, so Outfit (body) and Barlow Condensed (headings) each ship
// static per-weight files. See src/components/ui/Typography.tsx.
const FONTS = {
  "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
  "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
  "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
  "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
  "Outfit-ExtraBold": require("../assets/fonts/Outfit-ExtraBold.ttf"),
  "BarlowCondensed-SemiBold": require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
  "BarlowCondensed-Bold": require("../assets/fonts/BarlowCondensed-Bold.ttf"),
  "BarlowCondensed-ExtraBold": require("../assets/fonts/BarlowCondensed-ExtraBold.ttf"),
  "BarlowCondensed-Black": require("../assets/fonts/BarlowCondensed-Black.ttf"),
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);

  // Narrow selectors, so the root navigator doesn't re-render on store
  // writes it doesn't read — notably the hourly token refresh replacing
  // `session`.
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
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
    const inResetPassword = inAuth && segments[1] === "reset-password";

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

    // Every account type (athlete, parent, coach) gets the same athlete
    // home for now — there are no role-specific views.
    if (status === "authenticated") {
      // Allow the reset-password screen to complete before redirecting.
      if (inResetPassword) return;
      if (inRoot || inAuth) router.replace("/(app)/player");
    }
  }, [status, segments]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (status === "loading") {
    return null;
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
