import { Body, ScreenTitle } from "@/src/components/ui";
import { ProgramCard } from "@/src/components/training/ProgramCard";
import { colors } from "@/src/constants/theme";
import {
  listAssignedPrograms,
  type AthleteProgramCard as AthleteProgramCardData,
} from "@/src/services/program.service";
import { useAuthStore } from "@/src/stores/auth.store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import { DashboardLayout } from "@/src/components/dashboard";

export default function TrainingScreen() {
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const [cards, setCards] = useState<AthleteProgramCardData[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await listAssignedPrograms(profile.id);
    setCards(data);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const active = cards?.find((c) => c.completedSessions > 0) ?? null;
  const rest = (cards ?? []).filter((c) => c !== active);

  return (
    <DashboardLayout role="player" activeTab="dashboard">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-1.5">
          <ScreenTitle>Programs</ScreenTitle>
        </View>

        {cards === null ? (
          <ActivityIndicator color={colors.textTertiary} style={{ marginTop: 48 }} />
        ) : cards.length === 0 ? (
          <View className="px-5 pt-10">
            <Body className="text-center">No programs assigned yet.</Body>
          </View>
        ) : (
          <View className="px-5">
            {active ? (
              <ProgramCard
                card={active}
                variant="hero"
                onPress={() => router.push({ pathname: "/(app)/training/program", params: { programId: active.program.id } })}
              />
            ) : null}
            {rest.map((card) => (
              <ProgramCard
                key={card.program.id}
                card={card}
                variant="compact"
                onPress={() =>
                  router.push({
                    pathname: "/(app)/training/program",
                    params: { programId: card.program.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}
