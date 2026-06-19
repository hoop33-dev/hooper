import { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { roleConfig, type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";

import { BottomNav, type NavTabId } from "./BottomNav";

type DashboardLayoutProps = {
  role: RoleId;
  activeTab: NavTabId;
  children: ReactNode;
};

export function DashboardLayout({
  role,
  activeTab,
  children,
}: DashboardLayoutProps) {
  const r = roleConfig(role);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[r.headerTint, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "rgba(20,17,18,0.92)" }}
      >
        <BottomNav active={activeTab} role={role} />
      </SafeAreaView>
    </View>
  );
}
