import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { colors } from "@/src/constants/theme";
import { roleConfig, type RoleId } from "@/src/constants/roles";

import { HomeIcon, ChatIcon, SettingsIcon } from "./icons";

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
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(20,17,18,0.92)",
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        paddingBottom: 22,
        paddingTop: 6,
      }}
    >
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
              gap: 4,
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            {isActive && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  width: 28,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: r.accent,
                }}
              />
            )}
            <t.Icon size={22} color={color} />
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 10,
                fontWeight: isActive ? "700" : "500",
                letterSpacing: 10 * 0.05,
                color,
                textTransform: "uppercase",
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
