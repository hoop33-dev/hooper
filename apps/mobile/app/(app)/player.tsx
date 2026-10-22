import { DashboardHeader, DashboardLayout } from "@/src/components/dashboard";
import { ProgramCard } from "@/src/components/training/ProgramCard";
import { Body, Overline } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useAuthStore } from "@/src/stores/auth.store";
import { useProgramCardsStore } from "@/src/stores/programCards.store";
import type { AthleteProgramCard as AthleteProgramCardData } from "@hooper/api";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

function ProgramsSection({
  cards,
  onCardPress,
}: {
  cards: AthleteProgramCardData[];
  onCardPress: (programId: string) => void;
}) {
  if (cards.length === 0)
    return (
      <View className="px-5 pt-10">
        <Body className="text-center">No programs assigned yet.</Body>
      </View>
    );

  return (
    <View className="px-5">
      <Overline className="mb-2.5">Programs</Overline>
      {cards.map((card) => (
        <ProgramCard
          key={card.program.id}
          card={card}
          onPress={() => onCardPress(card.program.id)}
        />
      ))}
    </View>
  );
}

export default function PlayerDashboard() {
  const user = useDashboardUser();
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const cards = useProgramCardsStore((s) =>
    profile ? s.cardsByProfile[profile.id] : undefined,
  );
  const loadCards = useProgramCardsStore((s) => s.load);
  const [refreshing, setRefreshing] = useState(false);

  // Cached cards from a previous visit render immediately; this just
  // refreshes the cache quietly in the background, so switching tabs and
  // back doesn't flash a loading spinner over data we already have.
  useEffect(() => {
    if (profile) loadCards(profile.id);
  }, [profile, loadCards]);

  async function onRefresh() {
    if (!profile) return;
    setRefreshing(true);
    await loadCards(profile.id);
    setRefreshing(false);
  }

  function goToProgram(programId: string) {
    router.push({
      pathname: "/(app)/training/program",
      params: { programId },
    });
  }

  return (
    <DashboardLayout role="player" activeTab="dashboard">
      {user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textTertiary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}>
          <DashboardHeader
            role="player"
            firstName={user.firstName}
            initials={user.initials}
            imageUrl={user.avatarUrl}
          />
          {cards === undefined ? (
            <ActivityIndicator
              color={colors.textTertiary}
              style={{ marginTop: 48 }}
            />
          ) : (
            <ProgramsSection cards={cards} onCardPress={goToProgram} />
          )}
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}
    </DashboardLayout>
  );
}
