import { CheckIcon, ChevronIcon } from "@/src/components/dashboard/icons";
import { Meta, MicroLabel, Title } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import type { AthleteSessionListItem } from "@hooper/api";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ClockIcon, PlayIcon } from "./icons";

type SessionRowProps = {
  session: AthleteSessionListItem;
  isStarting?: boolean;
  onPress: () => void;
};

function TrailingAffordance({
  current,
  isStarting,
}: {
  current: boolean;
  isStarting: boolean;
}) {
  if (isStarting)
    return <ActivityIndicator size="small" color={colors.brandOrange} />;
  if (current) {
    return (
      <View className="bg-brand-orange rounded px-2 py-1">
        <MicroLabel className="text-white">Next</MicroLabel>
      </View>
    );
  }
  return <ChevronIcon size={16} color={colors.textDisabled} />;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes < 1 ? "<1" : minutes} min`;
}

function cardStyle(current: boolean, done: boolean) {
  return {
    backgroundColor: current ? "rgba(241,88,37,0.07)" : colors.surface2,
    borderColor: current ? "rgba(241,88,37,0.2)" : colors.borderSubtle,
    opacity: done ? 0.8 : 1,
  };
}

function StatusBadge({
  done,
  current,
  position,
}: {
  done: boolean;
  current: boolean;
  position: number;
}) {
  const tone = done ? colors.success : current ? colors.brandOrange : null;
  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full border-2"
      style={{
        backgroundColor: tone ?? colors.surface3,
        borderColor: tone ?? colors.borderSubtle,
      }}>
      {done ? (
        <CheckIcon size={15} color="#fff" />
      ) : current ? (
        <PlayIcon size={12} color="#fff" />
      ) : (
        <Title style={{ fontSize: 14 }}>{position + 1}</Title>
      )}
    </View>
  );
}

function SessionMeta({
  blockCount,
  dur,
  done,
}: {
  blockCount: number;
  dur: string | null;
  done: boolean;
}) {
  const blocksLabel = `${blockCount} block${blockCount === 1 ? "" : "s"}`;

  if (done && dur) {
    return (
      <View className="mt-1 flex-row items-center gap-1">
        <Meta>{blocksLabel}</Meta>
        <ClockIcon size={10} color={colors.textTertiary} />
        <Meta>{dur}</Meta>
      </View>
    );
  }
  return (
    <Meta className="mt-1">
      {blocksLabel}
      {dur ? ` · ${dur}` : ""}
    </Meta>
  );
}

export function SessionRow({
  session,
  isStarting = false,
  onPress,
}: SessionRowProps) {
  const { name, blockCount, done, current, durationSeconds, position } =
    session;
  const dur = formatDuration(durationSeconds);

  return (
    <Pressable
      onPress={onPress}
      disabled={isStarting}
      className="mb-3 flex-row items-center gap-3.5 rounded-2xl border px-4 py-4"
      style={cardStyle(current, done)}>
      <StatusBadge done={done} current={current} position={position} />

      <View className="flex-1">
        <Title className={done ? "text-text-secondary" : "text-text-primary"}>
          {name}
        </Title>
        <SessionMeta blockCount={blockCount} dur={dur} done={done} />
      </View>

      <TrailingAffordance current={current} isStarting={isStarting} />
    </Pressable>
  );
}
