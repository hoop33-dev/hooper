import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import { useAuthStore } from "@/src/stores/auth.store";
import { fonts } from "@/src/constants/theme";
import { useRouteGuard } from "@/src/hooks/useRouteGuard";

SplashScreen.preventAutoHideAsync().catch(() => {});

const FONT_MAP = {
  [fonts.headingMed]: require("../assets/fonts/BarlowCondensed-Medium.ttf"),
  [fonts.headingSemi]: require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
  [fonts.heading]: require("../assets/fonts/BarlowCondensed-Bold.ttf"),
  [fonts.headingBlack]: require("../assets/fonts/BarlowCondensed-Black.ttf"),
  [fonts.body]: require("../assets/fonts/Outfit-Regular.ttf"),
  [fonts.bodyMedium]: require("../assets/fonts/Outfit-Medium.ttf"),
  [fonts.bodySemi]: require("../assets/fonts/Outfit-SemiBold.ttf"),
  [fonts.bodyBold]: require("../assets/fonts/Outfit-Bold.ttf"),
  [fonts.bodyExtraBold]: require("../assets/fonts/Outfit-ExtraBold.ttf"),
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const { status, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useRouteGuard();

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
