import { useState } from "react";
import { View, ScrollView, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Circle, Path, Rect, Line } from "react-native-svg";

import { RadioTile } from "@/src/components/ui";

/* ── Role icons ─────────────────────────────────────────────── */

function PlayerIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Circle cx={32} cy={32} r={20} fill="#F15825" opacity={0.15} />
      <Circle cx={32} cy={32} r={16} fill="#F15825" opacity={0.9} />
      <Path
        d="M18 28 Q32 35 46 28"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M18 36 Q32 29 46 36"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M32 16 Q25 32 32 48"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M32 16 Q39 32 32 48"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Circle cx={26} cy={26} r={4} fill="rgba(255,255,255,0.2)" />
      <Circle cx={32} cy={32} r={22} fill="rgba(241,88,37,0.12)" />
    </Svg>
  );
}

function ParentIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Circle cx={24} cy={18} r={8} fill="#F68D68" opacity={0.9} />
      <Path d="M10 46 Q10 32 24 32 Q38 32 38 46" fill="#F68D68" opacity={0.7} />
      <Circle cx={42} cy={22} r={6} fill="#F15825" opacity={0.9} />
      <Path d="M30 46 Q30 36 42 36 Q54 36 54 46" fill="#F15825" opacity={0.7} />
      <Path d="M30 26 Q32 22 34 26 Q36 30 32 33 Q28 30 30 26Z" fill="#F15825" />
    </Svg>
  );
}

function CoachIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Rect
        x={14}
        y={16}
        width={36}
        height={40}
        rx={5}
        fill="#00205C"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1.5}
      />
      <Rect
        x={24}
        y={12}
        width={16}
        height={8}
        rx={4}
        fill="#3D3738"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      <Line
        x1={22}
        y1={30}
        x2={42}
        y2={30}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={22}
        y1={37}
        x2={38}
        y2={37}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={22}
        y1={44}
        x2={34}
        y2={44}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M22 30 L25 33 L30 27"
        stroke="#F15825"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ── Role config ─────────────────────────────────────────────── */

export type RoleId = "player" | "parent" | "coach";

type RoleConfig = {
  id: RoleId;
  label: string;
  title: string;
  body: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
  accentDim: string;
  accentBorder: string;
};

export const ROLES: RoleConfig[] = [
  {
    id: "player",
    label: "Athlete",
    title: "Player",
    body: "Get your program, log every session, and track your progress.",
    cta: "Sign up as a player",
    icon: <PlayerIcon />,
    accent: "#F15825",
    accentDim: "rgba(241,88,37,0.12)",
    accentBorder: "rgba(241,88,37,0.3)",
  },
  {
    id: "parent",
    label: "Guardian",
    title: "Parent",
    body: "Stay across your athlete's training and see their progress.",
    cta: "Sign up as a parent",
    icon: <ParentIcon />,
    accent: "#F68D68",
    accentDim: "rgba(246,141,104,0.10)",
    accentBorder: "rgba(246,141,104,0.25)",
  },
  {
    id: "coach",
    label: "Coaching Staff",
    title: "Coach",
    body: "Build programs, assign workouts, and follow your team's load.",
    cta: "Sign up as a coach",
    icon: <CoachIcon />,
    accent: "#4A7FD4",
    accentDim: "rgba(74,127,212,0.12)",
    accentBorder: "rgba(74,127,212,0.3)",
  },
];

/* ── Screen ──────────────────────────────────────────────────── */

export default function RoleSelectorScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<RoleId | null>(null);

  const selectedRole = ROLES.find((r) => r.id === selectedId) ?? null;

  function handleContinue() {
    if (!selectedId) return;
    router.push({
      pathname: "/(auth)/signup-details",
      params: { role: selectedId },
    });
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1A1718" }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
            opacity: pressed ? 0.6 : 1,
            alignSelf: "flex-start",
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
              d="M10 3L5 8L10 13"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Create account
          </Text>
        </Pressable>

        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "500",
            fontSize: 10,
            letterSpacing: 10 * 0.14,
            textTransform: "uppercase",
            color: "#F15825",
            marginBottom: 8,
          }}
        >
          Step 2 of 3
        </Text>

        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "900",
            fontSize: 28,
            letterSpacing: 28 * -0.03,
            color: "#FFFFFF",
            lineHeight: 28 * 1.12,
            marginBottom: 6,
          }}
        >
          Who are you?
        </Text>

        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 14 * 1.5,
          }}
        >
          Pick your role. You can add more later.
        </Text>
      </View>

      {/* Role tiles */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 4,
          paddingBottom: 8,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {ROLES.map((role) => (
          <RadioTile
            key={role.id}
            id={role.id}
            label={role.label}
            title={role.title}
            body={role.body}
            icon={role.icon}
            accent={role.accent}
            accentDim={role.accentDim}
            accentBorder={role.accentBorder}
            selected={selectedId === role.id}
            onPress={() => setSelectedId(role.id)}
          />
        ))}
      </ScrollView>

      {/* CTA */}
      <View
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!selectedId}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            backgroundColor: selectedRole ? selectedRole.accent : "#3D3738",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed && selectedId ? 0.85 : 1,
            transform: [{ scale: pressed && selectedId ? 0.97 : 1 }],
            shadowColor: selectedRole?.accent ?? "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: selectedRole ? 0.4 : 0,
            shadowRadius: 16,
            elevation: selectedRole ? 8 : 0,
          })}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 15,
              letterSpacing: 15 * 0.01,
              color: selectedId ? "#FFFFFF" : "rgba(255,255,255,0.35)",
            }}
          >
            {selectedRole ? selectedRole.cta : "Select a role to continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
