import { useState } from "react";
import { View, ScrollView, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { RadioTile } from "@/src/components/ui";
import { ROLES, type RoleId } from "@/src/constants/roles";

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
    <SafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-6 pt-2 pb-5">
        <Pressable
          onPress={() => router.back()}
          className="mb-6 flex-row items-center gap-1.5 self-start"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
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
            className="text-text-tertiary text-[13px]"
            style={{ fontFamily: "Inter" }}
          >
            Create account
          </Text>
        </Pressable>

        <Text
          className="text-brand-orange mb-2 text-[10px] font-medium uppercase"
          style={{ fontFamily: "Inter", letterSpacing: 10 * 0.14 }}
        >
          Step 2 of 3
        </Text>

        <Text
          className="text-text-primary mb-1.5 font-black"
          style={{
            fontFamily: "Inter",
            fontSize: 28,
            letterSpacing: 28 * -0.03,
            lineHeight: 28 * 1.12,
          }}
        >
          Who are you?
        </Text>

        <Text
          className="text-text-secondary text-sm"
          style={{ fontFamily: "Inter", lineHeight: 14 * 1.5 }}
        >
          Pick your role. You can add more later.
        </Text>
      </View>

      {/* Role tiles */}
      <ScrollView
        className="flex-1"
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
            icon={<role.Icon />}
            accent={role.accent}
            accentDim={role.accentDim}
            accentBorder={role.accentBorder}
            selected={selectedId === role.id}
            onPress={() => setSelectedId(role.id)}
          />
        ))}
      </ScrollView>

      {/* CTA */}
      <View className="px-6 pt-4 pb-3">
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
            className={`text-[15px] font-bold ${selectedId ? "text-text-primary" : "text-text-tertiary"}`}
            style={{ fontFamily: "Inter", letterSpacing: 15 * 0.01 }}
          >
            {selectedRole ? selectedRole.cta : "Select a role to continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
