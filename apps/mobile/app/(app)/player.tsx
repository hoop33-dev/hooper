import type { AthleteProgramCard as AthleteProgramCardData } from "@hooper/api";
import { DashboardHeader, DashboardLayout } from "@/src/components/dashboard";
import { DumbbellIcon } from "@/src/components/training/icons";
import { ProgramCard } from "@/src/components/training/ProgramCard";
import { MenuRow, Overline } from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { listAssignedPrograms } from "@/src/services/program.service";
import { useAuthStore } from "@/src/stores/auth.store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

function ActiveProgramSection({
  card,
  onPress,
}: {
  card: AthleteProgramCardData;
  onPress: () => void;
}) {
  return (
    <View className="px-5">
      <Overline className="mb-2.5">Active program</Overline>
      <ProgramCard card={card} variant="hero" onPress={onPress} />
    </View>
  );
}

function BrowseProgramsRow({ accent, onPress }: { accent: string; onPress: () => void }) {
  return (
    <View className="px-5">
      <MenuRow
        icon={<DumbbellIcon size={18} color={accent} />}
        title="Programs"
        sub="View and complete your training sessions"
        accent={accent}
        onPress={onPress}
      />
    </View>
  );
}

export default function PlayerDashboard() {
  const user = useDashboardUser();
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const accent = roleConfig("player").accent;
  const [activeCard, setActiveCard] = useState<AthleteProgramCardData | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const cards = await listAssignedPrograms(profile.id);
    setActiveCard(cards.find((c) => c.completedSessions > 0) ?? null);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  function goToProgram(programId: string) {
    router.push({ pathname: "/(app)/training/program", params: { programId } });
  }

  return (
    <DashboardLayout role="player" activeTab="dashboard">
      {user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <DashboardHeader
            role="player"
            firstName={user.firstName}
            initials={user.initials}
            imageUrl={user.avatarUrl}
          />
          {activeCard ? (
            <ActiveProgramSection card={activeCard} onPress={() => goToProgram(activeCard.program.id)} />
          ) : (
            <BrowseProgramsRow accent={accent} onPress={() => router.push("/(app)/training")} />
          )}
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}
    </DashboardLayout>
  );
}
