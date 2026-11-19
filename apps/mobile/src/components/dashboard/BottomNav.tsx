import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { bodyFont, colors } from "@/src/constants/theme";
import {
  INDICATOR_WIDTH,
  useBottomNavIndicator,
} from "@/src/hooks/useBottomNavIndicator";

import { ChatIcon, HomeIcon, SettingsIcon } from "./icons";

export type NavTabId = "dashboard" | "chat" | "settings";

type Tab = {
  id: NavTabId;
  label: string;
  Icon: typeof HomeIcon;
};

const TABS: Tab[] = [
  { id: "dashboard", label: "Home", Icon: HomeIcon },
  { id: "chat", label: "Chat", Icon: ChatIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

type BottomNavProps = {
  active: NavTabId;
};

export function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();
  const activeIndex = TABS.findIndex((t) => t.id === active);
  const { slotWidth, indicatorStyle, handleRowLayout } =
    useBottomNavIndicator(activeIndex);

  function go(id: NavTabId) {
    if (id === active) return;
    if (id === "dashboard") {
      router.replace("/(app)/player");
    } else if (id === "chat") {
      router.replace("/(app)/chat");
    } else {
      router.replace("/(app)/settings");
    }
  }

  return (
    <View
      onLayout={(e) => handleRowLayout(e, TABS.length)}
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(20,17,18,0.92)",
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        // No extra bottom padding: DashboardLayout already wraps the bar in
        // the bottom safe area (home indicator / gesture bar), and the tabs
        // carry their own 6px — anything more left the bar floating high.
        paddingTop: 6,
      }}>
      {slotWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              width: INDICATOR_WIDTH,
              height: 2,
              borderRadius: 2,
              backgroundColor: colors.brandOrange,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {TABS.map((t) => {
        const isActive = t.id === active;
        const color = isActive ? colors.brandOrange : colors.textTertiary;
        const label = t.label;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => go(t.id)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 8,
              paddingBottom: 6,
              gap: 3,
            }}>
            <t.Icon size={22} color={color} />
            <Text
              style={{
                fontFamily: bodyFont(isActive ? "600" : "500"),
                fontSize: 10.5,
                letterSpacing: 0.2,
                color,
              }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
