import { Button, Caption, H3 } from "@/src/components/ui";
import type { AthleteProgramCard as AthleteProgramCardData } from "@hooper/api";
import { Pressable, View } from "react-native";

import { ClockIcon } from "./icons";

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes < 1 ? "<1" : minutes} min`;
}

type ProgramCardProps = {
  card: AthleteProgramCardData;
  variant: "hero" | "compact";
  onPress: () => void;
};

export function ProgramCard({ card, variant, onPress }: ProgramCardProps) {
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

  // if (variant === "compact") {
  //   return (
  //     <Pressable
  //       onPress={onPress}
  //       className="bg-surface-2 border-border-subtle mb-2.5 flex-row items-center gap-3.5 rounded-2xl border px-4 py-3.5">
  //       <View className="bg-brand-navy h-12 w-12 items-center justify-center rounded-xl">
  //         <Meta className="text-white">{program.weeks}w</Meta>
  //       </View>
  //       <View className="flex-1">
  //         <RowTitle numberOfLines={1}>{program.name}</RowTitle>
  //         <Caption className="mt-0.5">
  //           {program.weeks} wk · {totalSessions} session
  //           {totalSessions === 1 ? "" : "s"}
  //         </Caption>
  //       </View>
  //       <View className="bg-brand-blue/10 rounded-full px-2.5 py-1">
  //         <Caption className="text-brand-blue uppercase">
  //           {started ? "In progress" : "Upcoming"}
  //         </Caption>
  //       </View>
  //     </Pressable>
  //   );
  // }

  return (
    <Pressable
      onPress={onPress}
      className="bg-brand-light-orange/25 mb-6 overflow-hidden rounded-[20px] border px-5 pt-4 pb-5">
      <H3 className="mb-3">{program.name}</H3>

      <View className="mb-4">
        <View className="mb-1.5 flex-row justify-between">
          <Caption>
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
              <Caption>{lastDur} last session</Caption>
            </View>
          ) : (
            <View />
          )}
          {nextSessionName ? (
            <Caption className="mt-0.5">{nextSessionName} next</Caption>
          ) : null}
        </View>
        <Button variant="secondary" size="sm" onPress={onPress}>
          {started ? "Continue" : "Start"}
        </Button>
      </View>
    </Pressable>
  );
}
