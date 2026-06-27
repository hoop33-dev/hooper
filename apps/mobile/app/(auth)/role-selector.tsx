import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AccentButton,
  BackButton,
  BodySm,
  Hero,
  Label,
  RadioTile,
} from "@/src/components/ui";
import { ROLES, type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";

const StyledSafeAreaView = styled(SafeAreaView);

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
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-6 pt-2 pb-5">
        <BackButton label="Create account" onPress={() => router.back()} />

        <Label className="text-brand-orange mb-2">Step 2 of 4</Label>

        <Hero className="mb-1.5">Who are you?</Hero>

        <BodySm>Pick your role. You can add more later.</BodySm>
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
        keyboardShouldPersistTaps="handled">
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
      <View className="px-6 pt-4 pb-3">
        <AccentButton
          accent={selectedRole?.accent ?? colors.surface3}
          variant={selectedRole ? "solid" : "muted"}
          disabled={!selectedId}
          onPress={handleContinue}>
          {selectedRole ? selectedRole.cta : "Select a role to continue"}
        </AccentButton>
      </View>
    </StyledSafeAreaView>
  );
}
