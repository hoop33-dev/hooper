import "../global.css";

import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { useAuthStore } from "@/src/stores/auth.store";
import { fonts } from "@/src/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const SHARED_ROUTES = new Set([
  "chat",
  "settings",
  "parent",
  "profile-settings",
  "security",
  "security-verify",
  "security-new-password",
]);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.headingMed]: require("../assets/fonts/BarlowCondensed-Medium.ttf"),
    [fonts.headingSemi]: require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
    [fonts.heading]: require("../assets/fonts/BarlowCondensed-Bold.ttf"),
    [fonts.headingBlack]: require("../assets/fonts/BarlowCondensed-Black.ttf"),
    [fonts.body]: require("../assets/fonts/Outfit-Regular.ttf"),
    [fonts.bodyMedium]: require("../assets/fonts/Outfit-Medium.ttf"),
    [fonts.bodySemi]: require("../assets/fonts/Outfit-SemiBold.ttf"),
    [fonts.bodyBold]: require("../assets/fonts/Outfit-Bold.ttf"),
    [fonts.bodyExtraBold]: require("../assets/fonts/Outfit-ExtraBold.ttf"),
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

    if (status === "authenticated") {
      // Allow the reset-password screen to complete before redirecting.
      if (inResetPassword) return;

      // Fall back to session user_metadata when profile hasn't loaded yet.
      // This prevents defaulting to "player" while primaryRole is still null.
      const role =
        primaryRole ??
        (session?.user?.user_metadata?.role as
          | import("@/src/types/database.types").RoleType
          | undefined) ??
        null;

      // Don't redirect until we know the role — avoids landing on the wrong dashboard.
      if (!role) return;

      if (inRoot || inAuth) {
        router.replace(`/(app)/${role}` as `/(app)/${typeof role}`);
        return;
      }
      // Prevent a user from staying on another role's dashboard.
      // Shared screens (chat, settings) and parent-only nested routes are allowed.
      if (inApp && segments[1] !== role && !SHARED_ROUTES.has(segments[1])) {
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
