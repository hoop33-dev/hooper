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
  setSessionEffortRpe,
} from "@/src/services/sessionCompletion.service";
import type { SessionCompletionRow } from "@hooper/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;
const MONTH_SECONDS = 30 * DAY_SECONDS;
const YEAR_SECONDS = 365 * DAY_SECONDS;

/** Scales up to a coarser unit as the duration grows, rather than always
 * showing raw minutes — a session left running for hours/days (e.g. an
 * unclosed completion) would otherwise render as a huge minute count that
 * wraps the stat tile onto multiple lines. */
function formatDuration(seconds: number): string {
  if (seconds < MINUTE_SECONDS) return "<1 min";
  if (seconds < 3 * HOUR_SECONDS) {
    return `${Math.round(seconds / MINUTE_SECONDS)} min`;
  }
  if (seconds < DAY_SECONDS) return `${Math.round(seconds / HOUR_SECONDS)}h`;
  if (seconds < WEEK_SECONDS) return `${Math.round(seconds / DAY_SECONDS)}d`;
  if (seconds < MONTH_SECONDS) {
    return `${Math.round(seconds / WEEK_SECONDS)}w`;
  }
  if (seconds < YEAR_SECONDS) {
    return `${Math.round(seconds / MONTH_SECONDS)}mo`;
  }
  return `${Math.round(seconds / YEAR_SECONDS)}y`;
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
  durationSeconds,
  sets,
  exercises,
}: {
  durationSeconds: number;
  /** Null while the (non-blocking) summary load is pending or failed. */
  sets: number | null;
  exercises: number | null;
}) {
  const stats: [string, string][] = [
    ["Duration", formatDuration(durationSeconds)],
    ["Sets", sets == null ? "—" : String(sets)],
    ["Exercises", exercises == null ? "—" : String(exercises)],
  ];
  return (
    <View className="bg-surface-2 mb-5 w-full flex-row overflow-hidden rounded-2xl">
      {stats.map(([label, value], i) => (
        <View
          key={label}
          className="border-border-subtle flex-1 items-center py-4"
          style={{ borderRightWidth: i < 2 ? 1 : 0 }}>
          <H2 className="text-center">{value}</H2>
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
  return (
    <View className="bg-surface-2 border-border-subtle w-full rounded-2xl border px-4.5 py-4">
      <RowTitle className="mb-0.5">How hard was it?</RowTitle>
      <Meta className="mb-3">
        {rpe === null
          ? "Rate perceived exertion · drag to set"
          : "Rate perceived exertion · 1–10"}
      </Meta>
      <Slider value={rpe ?? 6} min={1} max={10} onChange={onChange} />
    </View>
  );
}

type SessionStats = { sets: number; exercises: number };

async function loadSummaryStats(
  sessionCompletionId: string,
  sessionId: string,
) {
  const [session, logs] = await Promise.all([
    getSessionDetail(sessionId),
    getLogsForCompletion(sessionCompletionId),
  ]);
  const completedLogs = logs.filter((l) => l.status === "completed");
  // Logs are one row per measurement position, so a set tracking e.g. reps +
  // weight is two rows — count distinct (block_exercise_id, set_index) pairs.
  const completedSets = new Set(
    completedLogs.map((l) => `${l.block_exercise_id}:${l.set_index}`),
  );
  const exerciseIds = new Set(completedLogs.map((l) => l.block_exercise_id));
  return {
    sessionName: session.name,
    stats: { sets: completedSets.size, exercises: exerciseIds.size },
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
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [finalizeError, setFinalizeError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!sessionCompletionId || !sessionId) return;
    let cancelled = false;

    async function run() {
      // Critical: freeze the attempt as completed the moment this screen
      // opens, so backing out before rating it (Android back / iOS swipe)
      // can't leave a session stuck in_progress after the UI has announced
      // "Session done." effort_rpe stays null until Done fills it in.
      let finalized: SessionCompletionRow;
      try {
        finalized = await completeSession(sessionCompletionId!, null);
      } catch (e) {
        if (!cancelled) {
          console.warn("Failed to finalise the session", e);
          setFinalizeError(true);
        }
        return;
      }
      if (cancelled) return;
      setCompletion(finalized);

      // Cosmetic: the name + set/exercise counts. A failure here (session
      // renamed/deleted, flaky network) must not block the athlete from
      // rating the session and leaving — just show the stats as unknown.
      try {
        const summary = await loadSummaryStats(
          sessionCompletionId!,
          sessionId!,
        );
        if (cancelled) return;
        setSessionName(summary.sessionName);
        setStats(summary.stats);
      } catch (e) {
        if (!cancelled) console.warn("Couldn't load the session summary", e);
      }
    }

    setFinalizeError(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [sessionCompletionId, sessionId, reloadKey]);

  return {
    completion,
    sessionName,
    stats,
    finalizeError,
    retry: () => setReloadKey((k) => k + 1),
  };
}

export default function SessionCompleteScreen() {
  const { sessionCompletionId, sessionId } = useLocalSearchParams<{
    sessionCompletionId: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const { completion, sessionName, stats, finalizeError, retry } =
    useCompletionSummary(sessionCompletionId, sessionId);
  // Null until the athlete actually sets it — RPE feeds coach load
  // monitoring, so a fabricated mid-range default would be worse than
  // making them take the extra second to rate it.
  const [rpe, setRpe] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDone() {
    if (!completion || submitting || rpe === null) return;
    setSubmitting(true);
    try {
      await setSessionEffortRpe(completion.id, rpe);
      router.replace("/(app)/player");
    } finally {
      setSubmitting(false);
    }
  }

  if (finalizeError) {
    return (
      <View className="bg-surface flex-1 items-center justify-center px-8">
        <Caption className="mb-4 text-center">
          Couldn&apos;t save your session. Your logged sets are safe.
        </Caption>
        <Button variant="primary" size="md" onPress={retry}>
          Try again
        </Button>
      </View>
    );
  }

  if (!completion) {
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
        <Caption className="mb-7">{sessionName || " "}</Caption>
        <StatsRow
          durationSeconds={completion.active_duration_seconds ?? 0}
          sets={stats?.sets ?? null}
          exercises={stats?.exercises ?? null}
        />
        <RpeCard rpe={rpe} onChange={setRpe} />
      </View>
      <View className="pb-9">
        <Button
          variant="primary"
          size="lg"
          disabled={submitting || rpe === null}
          onPress={handleDone}>
          {submitting ? <ActivityIndicator color="#fff" /> : "Done"}
        </Button>
      </View>
    </View>
  );
}
