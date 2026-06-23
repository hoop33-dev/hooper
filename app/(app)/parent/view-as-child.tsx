import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
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
  ChevronIcon,
  CreditIcon,
  EyeIcon,
  HelpIcon,
  HomeIcon,
  LockIcon,
  SettingsIcon,
  XIcon,
} from "@/src/components/dashboard/icons";
import { roleConfig } from "@/src/constants/roles";
import { colors, fonts} from "@/src/constants/theme";
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
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[PLAYER.headerTint, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ViewAsBanner firstName={c.firstName} onExit={() => router.back()} />
        <TabContent tab={tab} child={c} />
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
  return <DashboardTab firstName={child.firstName} initials={child.initials} avatarUrl={child.avatarUrl} />;
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
    <LinearGradient
      colors={["#F8A488", "#F68D68"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
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
      }}>
      <EyeIcon size={14} color="#3A1F12" />
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.bodyBold,
          fontSize: 12.5,
          color: "#3A1F12",
          letterSpacing: -12.5 * 0.01,
        }}>
        Viewing as{" "}
        <Text style={{ fontFamily: fonts.bodyExtraBold }}>{firstName || "athlete"}</Text>
      </Text>
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Exit view as"
        hitSlop={8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          height: 28,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: "#3A1F12",
        }}>
        <XIcon size={11} color="#FBD9C9" />
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 12,
            color: "#FBD9C9",
          }}>
          Exit
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

/* ─── Chat tab (mirrors the child's chat screen) ────────────── */
function ChatTab() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}>
      <Text
        style={{
          fontFamily: fonts.headingBlack,
          fontSize: 22,
          color: colors.textPrimary,
          letterSpacing: -22 * 0.02,
          marginBottom: 8,
        }}>
        Chat
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textTertiary,
          textAlign: "center",
        }}>
        Coming soon.
      </Text>
    </View>
  );
}

/* ─── Settings tab (read-only view of the child's profile area) ─ */
function PreviewRow({
  icon,
  title,
  sub,
  locked,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  locked?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
        opacity: locked ? 0.55 : 1,
      }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: `${PLAYER.accent}14`,
          borderWidth: 1,
          borderColor: `${PLAYER.accent}30`,
          alignItems: "center",
          justifyContent: "center",
        }}>
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 14.5,
            color: colors.textPrimary,
            marginBottom: sub ? 2 : 0,
          }}>
          {title}
        </Text>
        {sub ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.textTertiary,
            }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {locked ? (
        <LockIcon size={16} color={colors.textTertiary} />
      ) : (
        <ChevronIcon size={16} color={colors.textTertiary} />
      )}
    </View>
  );
}

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
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 18,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 18,
        padding: 22,
        alignItems: "center",
        overflow: "hidden",
      }}>
      <LinearGradient
        colors={[`${PLAYER.accent}22`, "transparent"]}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80 }}
      />
      <Avatar
        role="player"
        size={84}
        initials={initials}
        imageUrl={avatarUrl}
      />
      <Text
        style={{
          fontFamily: fonts.bodyExtraBold,
          fontSize: 20,
          color: colors.textPrimary,
          letterSpacing: -20 * 0.02,
          marginTop: 14,
          marginBottom: 3,
        }}>
        {fullName}
      </Text>
      {username ? (
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 12,
            color: PLAYER.accent,
            letterSpacing: 12 * 0.06,
          }}>
          @{username}
        </Text>
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
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 }}>
        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontSize: 22,
            color: colors.textPrimary,
            letterSpacing: -22 * 0.03,
          }}>
          Profile
        </Text>
      </View>

      <SettingsIdentity
        initials={initials}
        fullName={fullName}
        username={username}
        avatarUrl={avatarUrl}
      />

      {locked ? <GuardianBanner kind="profile" /> : null}

      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <PreviewRow
          icon={<SettingsIcon size={18} color={PLAYER.accent} />}
          title="Profile settings"
          sub={
            locked ? "Managed by your guardian" : "Photo, name, username, bio"
          }
          locked={locked}
        />
        <PreviewRow
          icon={<CreditIcon size={18} color={PLAYER.accent} />}
          title="Subscription & billing"
          sub="Managed by your guardian"
          locked
        />
        <PreviewRow
          icon={<BellIcon size={18} color={PLAYER.accent} />}
          title="Notifications"
          sub="Push, email, SMS"
        />
        <PreviewRow
          icon={<HelpIcon size={18} color={PLAYER.accent} />}
          title="Help & FAQs"
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
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(20,17,18,0.92)",
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
        paddingBottom: 22,
        paddingTop: 6,
      }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        const color = isActive ? PLAYER.accent : colors.textTertiary;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            onPress={() => onChange(t.id)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingTop: 6,
              paddingBottom: 4,
            }}>
            {isActive ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  width: 28,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: PLAYER.accent,
                }}
              />
            ) : null}
            <t.Icon size={22} color={color} />
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 10,
                letterSpacing: 10 * 0.05,
                color,
                textTransform: "uppercase",
              }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
