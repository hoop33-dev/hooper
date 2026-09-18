import { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type RoleId } from "@/src/constants/roles";
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
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "rgba(20,17,18,0.92)" }}>
        <BottomNav active={activeTab} role={role} />
      </SafeAreaView>
    </View>
  );
}
