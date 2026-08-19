import {
  Button,
  Caption,
  H2,
  Meta,
  RowTitle,
  Slider,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { getLogsForCompletion } from "@/src/services/measurementLog.service";
import { getSessionDetail } from "@/src/services/program.service";
import {
  completeSession,
  getCompletion,
} from "@/src/services/sessionCompletion.service";
import type { SessionCompletionRow } from "@hooper/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Svg, { Path } from "react-native-svg";

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes < 1 ? "<1" : minutes} min`;
}

function SuccessBadge() {
  return (
    <View className="border-success bg-success/10 mb-5 h-[88px] w-[88px] items-center justify-center rounded-full border-2">
      <Svg width={38} height={38} viewBox="0 0 38 38" fill="none">
        <Path
          d="M7 19l8 8 16-14"
          stroke={colors.success}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function StatsRow({
  elapsedSeconds,
  sets,
  exercises,
}: {
  elapsedSeconds: number;
  sets: number;
  exercises: number;
}) {
  const stats: [string, string][] = [
    ["Duration", formatDuration(elapsedSeconds)],
    ["Sets", String(sets)],
    ["Exercises", String(exercises)],
  ];
  return (
    <View className="bg-surface-2 mb-5 w-full flex-row overflow-hidden rounded-2xl">
      {stats.map(([label, value], i) => (
        <View
          key={label}
          className="border-border-subtle flex-1 items-center py-4"
          style={{ borderRightWidth: i < 2 ? 1 : 0 }}>
          <H2>{value}</H2>
          <Caption className="mt-0.5">{label}</Caption>
        </View>
      ))}
    </View>
  );
}

function RpeCard({
  rpe,
  onChange,
}: {
  rpe: number | null;
  onChange: (n: number) => void;
}) {
  const current = rpe ?? Math.round((1 + 10) / 2);
  return (
    <View className="bg-surface-2 border-border-subtle w-full rounded-2xl border px-4.5 py-4">
      <RowTitle className="mb-0.5">How hard was it?</RowTitle>
      <Meta className="mb-3">Rate perceived exertion · 1–10</Meta>
      <Slider value={current} min={1} max={10} onChange={onChange} />
    </View>
  );
}

async function loadCompletionSummary(
  sessionCompletionId: string,
  sessionId: string,
) {
  const [completion, session, logs] = await Promise.all([
    getCompletion(sessionCompletionId),
    getSessionDetail(sessionId),
    getLogsForCompletion(sessionCompletionId),
  ]);
  const completedLogs = logs.filter((l) => l.status === "completed");
  const exerciseIds = new Set(completedLogs.map((l) => l.block_exercise_id));
  return {
    completion,
    sessionName: session.name,
    stats: { sets: completedLogs.length, exercises: exerciseIds.size },
  };
}

function useCompletionSummary(
  sessionCompletionId: string | undefined,
  sessionId: string | undefined,
) {
  const [completion, setCompletion] = useState<SessionCompletionRow | null>(
    null,
  );
  const [sessionName, setSessionName] = useState("");
  const [stats, setStats] = useState<{
    sets: number;
    exercises: number;
  } | null>(null);

  useEffect(() => {
    if (!sessionCompletionId || !sessionId) return;
    let cancelled = false;
    async function load() {
      const summary = await loadCompletionSummary(
        sessionCompletionId!,
        sessionId!,
      );
      if (cancelled) return;
      setCompletion(summary.completion);
      setSessionName(summary.sessionName);
      setStats(summary.stats);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionCompletionId, sessionId]);

  return { completion, sessionName, stats };
}

function useElapsedSeconds(completion: SessionCompletionRow | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!completion) return;
    function tick() {
      const elapsedMs = Date.now() - new Date(completion!.started_at).getTime();
      setElapsedSeconds(
        Math.max(
          0,
          Math.round(elapsedMs / 1000) - completion!.paused_duration_seconds,
        ),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [completion]);

  return elapsedSeconds;
}

export default function SessionCompleteScreen() {
  const { sessionCompletionId, sessionId } = useLocalSearchParams<{
    sessionCompletionId: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const { completion, sessionName, stats } = useCompletionSummary(
    sessionCompletionId,
    sessionId,
  );
  const elapsedSeconds = useElapsedSeconds(completion);
  const [rpe, setRpe] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDone() {
    if (!rpe || !completion || submitting) return;
    setSubmitting(true);
    try {
      await completeSession(completion.id, rpe);
      router.replace("/(app)/training");
    } finally {
      setSubmitting(false);
    }
  }

  if (!completion || !stats) {
    return (
      <View className="bg-surface flex-1 items-center justify-center">
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <View className="bg-surface flex-1 px-6">
      <View className="flex-1 items-center justify-center">
        <SuccessBadge />
        <H2 className="mb-1">Session done.</H2>
        <Caption className="mb-7">{sessionName}</Caption>
        <StatsRow
          elapsedSeconds={elapsedSeconds}
          sets={stats.sets}
          exercises={stats.exercises}
        />
        <RpeCard rpe={rpe} onChange={setRpe} />
      </View>
      <View className="pb-9">
        <Button
          variant="primary"
          size="lg"
          disabled={!rpe || submitting}
          onPress={handleDone}>
          {submitting ? <ActivityIndicator color="#fff" /> : "Done"}
        </Button>
      </View>
    </View>
  );
}
