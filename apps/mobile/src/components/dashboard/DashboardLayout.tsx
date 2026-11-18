import { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/constants/theme";

import { BottomNav, type NavTabId } from "./BottomNav";

type DashboardLayoutProps = {
  activeTab: NavTabId;
  children: ReactNode;
};

export function DashboardLayout({ activeTab, children }: DashboardLayoutProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "rgba(20,17,18,0.92)" }}>
        <BottomNav active={activeTab} />
      </SafeAreaView>
    </View>
  );
}
