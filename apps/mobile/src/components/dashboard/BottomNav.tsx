import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { roleConfig, type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
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
  { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
  { id: "chat", label: "Chat", Icon: ChatIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

type BottomNavProps = {
  active: NavTabId;
  role: RoleId;
};

export function BottomNav({ active, role }: BottomNavProps) {
  const router = useRouter();
  const r = roleConfig(role);
  const activeIndex = TABS.findIndex((t) => t.id === active);
  const { slotWidth, indicatorStyle, handleRowLayout } =
    useBottomNavIndicator(activeIndex);

  function go(id: NavTabId) {
    if (id === active) return;
    if (id === "dashboard") {
      router.replace(`/(app)/${role}` as `/(app)/${RoleId}`);
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
        paddingBottom: 14,
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
              backgroundColor: r.accent,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {TABS.map((t) => {
        const isActive = t.id === active;
        const color = isActive ? r.accent : colors.textTertiary;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            onPress={() => go(t.id)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 8,
              paddingBottom: 6,
            }}>
            <t.Icon size={22} color={color} />
          </Pressable>
        );
      })}
    </View>
  );
}
