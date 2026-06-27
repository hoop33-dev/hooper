import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Avatar,
  DashboardHeader,
  GuardianBanner,
} from "@/src/components/dashboard";
import {
  BellIcon,
  ChatIcon,
  CreditIcon,
  EyeIcon,
  HelpIcon,
  HomeIcon,
  SettingsIcon,
  XIcon,
} from "@/src/components/dashboard/icons";
import {
  BodySm,
  MenuRow,
  Meta,
  MicroLabel,
  ScreenTitle,
  Title,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import {
  getChildProfile,
  type ChildProfile,
} from "@/src/services/parent.service";

const PLAYER = roleConfig("player");

type Tab = "dashboard" | "chat" | "settings";
type ResolvedChild = {
  firstName: string;
  lastName: string;
  username: string;
  initials: string;
  avatarUrl: string | null;
  locked: boolean;
};

type Params = {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

function initialsOf(first: string, last: string): string {
  return (
    (first.charAt(0) + last.charAt(0)).toUpperCase() ||
    first.charAt(0).toUpperCase() ||
    "?"
  );
}

function resolveChild(
  child: ChildProfile | null,
  params: Params,
): ResolvedChild {
  const firstName = child?.firstName ?? params.firstName ?? "";
  const lastName = child?.lastName ?? params.lastName ?? "";
  const username = child?.username ?? params.username ?? "";
  return {
    firstName,
    lastName,
    username,
    initials: initialsOf(firstName, lastName),
    avatarUrl: child?.avatarUrl ?? null,
    locked: child?.profileSettingsLocked ?? false,
  };
}

/**
 * Lets a parent step into their child's player experience. It renders the same
 * tabs the child sees (Dashboard / Chat / Settings) populated with the child's
 * data, topped by a persistent "Viewing as" banner. Everything is read-only —
 * the parent stays signed in as themselves, so nothing here can mutate either
 * account; they exit with the banner's button.
 */
export default function ViewAsChildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [child, setChild] = useState<ChildProfile | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    void (async () => {
      const c = await getChildProfile(params.id);
      if (!cancelled && c) setChild(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const c = resolveChild(child, params);

  return (
    <View className="bg-surface flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ViewAsBanner firstName={c.firstName} onExit={() => router.back()} />
        <View style={{ flex: 1 }}>
          <TabContent tab={tab} child={c} />
        </View>
      </SafeAreaView>

      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "rgba(20,17,18,0.92)" }}>
        <LocalNav active={tab} onChange={setTab} />
      </SafeAreaView>
    </View>
  );
}

function TabContent({ tab, child }: { tab: Tab; child: ResolvedChild }) {
  if (tab === "chat") return <ChatTab />;
  if (tab === "settings")
    return (
      <SettingsTab
        initials={child.initials}
        fullName={`${child.firstName} ${child.lastName}`.trim()}
        username={child.username}
        avatarUrl={child.avatarUrl}
        locked={child.locked}
      />
    );
  return (
    <DashboardTab
      firstName={child.firstName}
      initials={child.initials}
      avatarUrl={child.avatarUrl}
    />
  );
}

function DashboardTab({
  firstName,
  initials,
  avatarUrl,
}: {
  firstName: string;
  initials: string;
  avatarUrl: string | null;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}>
      <DashboardHeader
        role="player"
        firstName={firstName}
        initials={initials}
        imageUrl={avatarUrl}
      />
    </ScrollView>
  );
}

/* ─── Persistent "Viewing as" banner ────────────────────────── */
function ViewAsBanner({
  firstName,
  onExit,
}: {
  firstName: string;
  onExit: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 6,
        paddingVertical: 8,
        paddingLeft: 14,
        paddingRight: 8,
        borderRadius: 999,
        backgroundColor: "#F68D68",
      }}>
      <EyeIcon size={14} color="#3A1F12" />
      <Meta className="flex-1" style={{ color: "#3A1F12" }}>
        Viewing as{" "}
        <Text className="font-extrabold">{firstName || "athlete"}</Text>
      </Meta>
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Exit view as"
        hitSlop={8}
        className="h-7 flex-row items-center gap-1.5 rounded-full px-3"
        style={{ backgroundColor: "#3A1F12" }}>
        <XIcon size={11} color="#FBD9C9" />
        <Meta style={{ color: "#FBD9C9" }}>Exit</Meta>
      </Pressable>
    </View>
  );
}

/* ─── Chat tab (mirrors the child's chat screen) ────────────── */
function ChatTab() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Title className="mb-2">Chat</Title>
      <BodySm className="text-text-tertiary text-center">Coming soon.</BodySm>
    </View>
  );
}

/* ─── Settings tab (read-only view of the child's profile area) ─ */
function SettingsIdentity({
  initials,
  fullName,
  username,
  avatarUrl,
}: {
  initials: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}) {
  return (
    <View className="bg-surface-2 border-border-subtle mx-5 mb-5 items-center overflow-hidden rounded-[18px] border p-5">
      <Avatar
        role="player"
        size={84}
        initials={initials}
        imageUrl={avatarUrl}
      />
      <Title className="mt-3.5 mb-0.5">{fullName}</Title>
      {username ? (
        <Meta style={{ color: PLAYER.accent }}>@{username}</Meta>
      ) : null}
    </View>
  );
}

function SettingsTab({
  initials,
  fullName,
  username,
  avatarUrl,
  locked,
}: {
  initials: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  locked: boolean;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-5 pt-1.5 pb-5">
        <ScreenTitle>Profile</ScreenTitle>
      </View>

      <SettingsIdentity
        initials={initials}
        fullName={fullName}
        username={username}
        avatarUrl={avatarUrl}
      />

      {locked ? <GuardianBanner kind="profile" /> : null}

      <View className="gap-2 px-5">
        <MenuRow
          icon={<SettingsIcon size={18} color={PLAYER.accent} />}
          title="Profile settings"
          sub={
            locked ? "Managed by your guardian" : "Photo, name, username, bio"
          }
          accent={PLAYER.accent}
          locked={locked}
        />
        <MenuRow
          icon={<CreditIcon size={18} color={PLAYER.accent} />}
          title="Subscription & billing"
          sub="Managed by your guardian"
          accent={PLAYER.accent}
          locked
        />
        <MenuRow
          icon={<BellIcon size={18} color={PLAYER.accent} />}
          title="Notifications"
          sub="Push, email, SMS"
          accent={PLAYER.accent}
        />
        <MenuRow
          icon={<HelpIcon size={18} color={PLAYER.accent} />}
          title="Help & FAQs"
          accent={PLAYER.accent}
        />
      </View>
    </ScrollView>
  );
}

/* ─── Local bottom nav (switches preview tabs, no routing) ───── */
function LocalNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
    { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
    { id: "chat", label: "Chat", Icon: ChatIcon },
    { id: "settings", label: "Settings", Icon: SettingsIcon },
  ];
  return (
    <View
      className="border-border-subtle flex-row border-t pt-1.5 pb-[22px]"
      style={{ backgroundColor: "rgba(20,17,18,0.92)" }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        const color = isActive ? PLAYER.accent : colors.textTertiary;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            onPress={() => onChange(t.id)}
            className="flex-1 items-center justify-center gap-1 pt-1.5 pb-1">
            {isActive ? (
              <View
                className="absolute top-0 h-0.5 w-7 rounded-sm"
                style={{ backgroundColor: PLAYER.accent }}
              />
            ) : null}
            <t.Icon size={22} color={color} />
            <MicroLabel style={{ color }}>{t.label}</MicroLabel>
          </Pressable>
        );
      })}
    </View>
  );
}
