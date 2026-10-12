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
  highlighted,
  active,
  isStarting,
}: {
  highlighted: boolean;
  active: boolean;
  isStarting: boolean;
}) {
  if (isStarting)
    return <ActivityIndicator size="small" color={colors.brandOrange} />;
  if (highlighted) {
    return (
      <View className="bg-brand-orange rounded px-2 py-1">
        <MicroLabel className="text-white">
          {active ? "Continue" : "Next"}
        </MicroLabel>
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

/** "started x ago" phrasing for an in-progress session row. */
function formatElapsed(startedAt: string): string {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(startedAt).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

function cardStyle(highlighted: boolean, done: boolean) {
  return {
    backgroundColor: highlighted ? "rgba(241,88,37,0.07)" : colors.surface2,
    borderColor: highlighted ? "rgba(241,88,37,0.2)" : colors.borderSubtle,
    opacity: done ? 0.8 : 1,
  };
}

function StatusBadge({
  done,
  highlighted,
  position,
}: {
  done: boolean;
  highlighted: boolean;
  position: number;
}) {
  const tone = done ? colors.success : highlighted ? colors.brandOrange : null;
  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full border-2"
      style={{
        backgroundColor: tone ?? colors.surface3,
        borderColor: tone ?? colors.borderSubtle,
      }}>
      {done ? (
        <CheckIcon size={15} color="#fff" />
      ) : highlighted ? (
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
  active,
  activeStartedAt,
}: {
  blockCount: number;
  dur: string | null;
  done: boolean;
  active: boolean;
  activeStartedAt: string | null;
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
  if (active && activeStartedAt) {
    return (
      <View className="mt-1 flex-row items-center">
        <Meta className="pr-2">{blocksLabel}</Meta>
        <Meta>started {formatElapsed(activeStartedAt)} ago</Meta>
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
  const {
    name,
    blockCount,
    done,
    current,
    active,
    activeStartedAt,
    durationSeconds,
    position,
  } = session;
  const dur = formatDuration(durationSeconds);
  const highlighted = current || active;

  return (
    <Pressable
      onPress={onPress}
      disabled={isStarting}
      className="mb-3 flex-row items-center gap-3.5 rounded-2xl border px-4 py-4"
      style={cardStyle(highlighted, done)}>
      <StatusBadge done={done} highlighted={highlighted} position={position} />

      <View className="flex-1">
        <Title className={done ? "text-text-secondary" : "text-text-primary"}>
          {name}
        </Title>
        <SessionMeta
          blockCount={blockCount}
          dur={dur}
          done={done}
          active={active}
          activeStartedAt={activeStartedAt}
        />
      </View>

      <TrailingAffordance
        highlighted={highlighted}
        active={active}
        isStarting={isStarting}
      />
    </Pressable>
  );
}
