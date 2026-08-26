import { Button, Caption, GradientCard, H3 } from "@/src/components/ui";
import type { AthleteProgramCard as AthleteProgramCardData } from "@hooper/api";
import { View } from "react-native";

import { ClockIcon } from "./icons";

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes < 1 ? "<1" : minutes} min`;
}

type ProgramCardProps = {
  card: AthleteProgramCardData;
  onPress: () => void;
};

export function ProgramCard({ card, onPress }: ProgramCardProps) {
  const {
    program,
    totalSessions,
    completedSessions,
    lastSessionDurationSeconds,
    nextSessionName,
  } = card;
  const pct =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;
  const started = completedSessions > 0;
  const lastDur = formatDuration(lastSessionDurationSeconds);

  return (
    <GradientCard
      onPress={onPress}
      className="mb-3 rounded-[20px]"
      contentClassName="px-5 pt-4 pb-5">
      <H3 className="mb-3">{program.name}</H3>

      <View className="mb-4">
        <View className="mb-1.5 flex-row justify-between">
          <Caption className="text-white/70">
            {completedSessions}/{totalSessions} sessions
          </Caption>
          <Caption className="text-white">{pct}%</Caption>
        </View>
        <View className="h-1 rounded-full bg-white/15">
          <View
            className="h-full rounded-full bg-white"
            style={{ width: `${pct}%` }}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          {lastDur ? (
            <View className="flex-row items-center gap-1.5">
              <ClockIcon size={12} color="rgba(255,255,255,0.5)" />
              <Caption className="text-white/70">
                {lastDur} last session
              </Caption>
            </View>
          ) : (
            <View />
          )}
          {nextSessionName ? (
            <Caption className="mt-0.5 text-white/70">
              {nextSessionName} next
            </Caption>
          ) : null}
        </View>
        <Button variant="secondary" size="sm" onPress={onPress}>
          {started ? "Continue" : "Start"}
        </Button>
      </View>
    </GradientCard>
  );
}
