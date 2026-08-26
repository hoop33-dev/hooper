import { SessionRow } from "@/src/components/training/SessionRow";
import {
  BackButton,
  Caption,
  GradientCard,
  H3,
  Overline,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import {
  getProgram,
  listProgramSessions,
  type AthleteSessionListItem,
} from "@/src/services/program.service";
import {
  getInProgressCompletion,
  startOrResumeSession,
} from "@/src/services/sessionCompletion.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { ProgramRow } from "@hooper/db";
import { useLocalSearchParams, useRouter, type Router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

function groupByWeek(
  sessions: AthleteSessionListItem[],
): [number, AthleteSessionListItem[]][] {
  const weeks = new Map<number, AthleteSessionListItem[]>();
  for (const s of sessions) {
    const list = weeks.get(s.weekNumber) ?? [];
    list.push(s);
    weeks.set(s.weekNumber, list);
  }
  return [...weeks.entries()];
}

/** Resumes an in-progress attempt, routes through the pre-session form if
 * the program has one, or starts the session directly — same decision every
 * "start/continue" entry point in this screen needs. Works for any session,
 * not just the current one, so an athlete can jump ahead or redo a past one. */
async function navigateToSession(
  router: Router,
  session: AthleteSessionListItem,
  program: ProgramRow,
  athleteProfileId: string,
) {
  const inProgress = await getInProgressCompletion(
    session.id,
    athleteProfileId,
  );
  if (inProgress) {
    router.push({
      pathname: "/(app)/training/play",
      params: { sessionId: session.id },
    });
    return;
  }
  if (program.form_id) {
    router.push({
      pathname: "/(app)/training/pre-form",
      params: { sessionId: session.id, programId: program.id },
    });
    return;
  }
  await startOrResumeSession(session.id, athleteProfileId);
  router.push({
    pathname: "/(app)/training/play",
    params: { sessionId: session.id },
  });
}

function ProgressSummaryCard({
  program,
  completedCount,
  totalCount,
}: {
  program: ProgramRow;
  completedCount: number;
  totalCount: number;
}) {
  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const width = useSharedValue(pct);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 300 });
  }, [pct, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <GradientCard
      className="mx-5 mb-4 rounded-2xl"
      contentClassName="px-5 py-5">
      <H3 className="mb-3">{program.name}</H3>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Caption className="text-white/70">
          {completedCount}/{totalCount} sessions
        </Caption>
        <Caption className="text-white">{pct}%</Caption>
      </View>
      <View className="h-1.5 rounded-full bg-white/20">
        <Animated.View
          className="h-full rounded-full bg-white"
          style={fillStyle}
        />
      </View>
    </GradientCard>
  );
}

type CurrentRowLayout = { weekNumber: number; y: number; height: number };

/** Centres the "current" session in the ScrollView viewport the first time
 * its layout becomes known, so the athlete doesn't have to scroll to find
 * where they left off.
 *
 * Deliberately avoids `measureLayout`/`measure` — with NativeWind's
 * `className` interop, `View` refs aren't guaranteed to resolve to a native
 * host component, and those APIs throw ("ref.measureLayout must be called
 * with a ref to a native component") when they don't. `onLayout` works
 * regardless, and since each week group renders as a direct child of the
 * ScrollView's content, its reported `y` is already the group's absolute
 * offset within scroll content — no ref measurement needed. */
function useScrollToCurrentSession(
  currentSession: AthleteSessionListItem | null,
) {
  const scrollViewRef = useRef<ScrollView>(null);
  const viewportHeightRef = useRef(0);
  const weekOffsetsRef = useRef(new Map<number, number>());
  const currentRowRef = useRef<CurrentRowLayout | null>(null);
  const hasScrolledRef = useRef(false);

  const tryScroll = useCallback(() => {
    if (hasScrolledRef.current || !currentSession || !currentRowRef.current)
      return;
    const weekY = weekOffsetsRef.current.get(currentRowRef.current.weekNumber);
    if (weekY === undefined) return;
    const rowY = weekY + currentRowRef.current.y;
    hasScrolledRef.current = true;
    scrollViewRef.current?.scrollTo({
      y: Math.max(
        0,
        rowY + currentRowRef.current.height / 2 - viewportHeightRef.current / 2,
      ),
      animated: true,
    });
  }, [currentSession]);

  const onScrollViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      viewportHeightRef.current = e.nativeEvent.layout.height;
      tryScroll();
    },
    [tryScroll],
  );

  const onWeekLayout = useCallback(
    (weekNumber: number, e: LayoutChangeEvent) => {
      weekOffsetsRef.current.set(weekNumber, e.nativeEvent.layout.y);
      tryScroll();
    },
    [tryScroll],
  );

  const onCurrentRowLayout = useCallback(
    (weekNumber: number, e: LayoutChangeEvent) => {
      currentRowRef.current = {
        weekNumber,
        y: e.nativeEvent.layout.y,
        height: e.nativeEvent.layout.height,
      };
      tryScroll();
    },
    [tryScroll],
  );

  return {
    scrollViewRef,
    onScrollViewLayout,
    onWeekLayout,
    onCurrentRowLayout,
  };
}

function SessionWeekList({
  sessions,
  startingSessionId,
  onWeekLayout,
  onCurrentRowLayout,
  onSessionPress,
}: {
  sessions: AthleteSessionListItem[];
  startingSessionId: string | null;
  onWeekLayout: (weekNumber: number, e: LayoutChangeEvent) => void;
  onCurrentRowLayout: (weekNumber: number, e: LayoutChangeEvent) => void;
  onSessionPress: (session: AthleteSessionListItem) => void;
}) {
  if (sessions.length === 0)
    return <Caption className="text-center">No sessions yet.</Caption>;
  return (
    <>
      {groupByWeek(sessions).map(([weekNumber, weekSessions]) => (
        <View
          key={weekNumber}
          className="mb-5"
          onLayout={(e) => onWeekLayout(weekNumber, e)}>
          <Overline className="mb-2.5">Week {weekNumber}</Overline>
          {weekSessions.map((session) => (
            <View
              key={session.id}
              onLayout={
                session.current
                  ? (e) => onCurrentRowLayout(weekNumber, e)
                  : undefined
              }>
              <SessionRow
                session={session}
                isStarting={startingSessionId === session.id}
                onPress={() => onSessionPress(session)}
              />
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export default function ProgramDetailScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [program, setProgram] = useState<ProgramRow | null>(null);
  const [sessions, setSessions] = useState<AthleteSessionListItem[] | null>(
    null,
  );
  const [startingSessionId, setStartingSessionId] = useState<string | null>(
    null,
  );
  const load = useCallback(async () => {
    if (!profile || !programId) return;
    const [programRow, sessionRows] = await Promise.all([
      getProgram(programId),
      listProgramSessions(programId, profile.id),
    ]);
    setProgram(programRow);
    setSessions(sessionRows);
  }, [profile, programId]);

  useEffect(() => {
    load();
  }, [load]);

  const currentSession = sessions?.find((s) => s.current) ?? null;
  const completedCount = sessions?.filter((s) => s.done).length ?? 0;
  const {
    scrollViewRef,
    onScrollViewLayout,
    onWeekLayout,
    onCurrentRowLayout,
  } = useScrollToCurrentSession(currentSession);

  async function handleSessionPress(session: AthleteSessionListItem) {
    if (!profile || !program || startingSessionId) return;
    setStartingSessionId(session.id);
    try {
      await navigateToSession(router, session, program, profile.id);
    } finally {
      setStartingSessionId(null);
    }
  }

  return (
    <View className="bg-surface flex-1">
      <View className="px-5 pt-[58px] pb-4">
        <BackButton
          label="Programs"
          onPress={() => router.back()}
          className="mb-0"
        />
      </View>
      {!program || !sessions ? (
        <ActivityIndicator
          color={colors.textTertiary}
          style={{ marginTop: 48 }}
        />
      ) : (
        <>
          <ProgressSummaryCard
            program={program}
            completedCount={completedCount}
            totalCount={sessions.length}
          />
          <ScrollView
            ref={scrollViewRef}
            onLayout={onScrollViewLayout}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            className="px-5">
            <SessionWeekList
              sessions={sessions}
              startingSessionId={startingSessionId}
              onWeekLayout={onWeekLayout}
              onCurrentRowLayout={onCurrentRowLayout}
              onSessionPress={handleSessionPress}
            />
          </ScrollView>
        </>
      )}
    </View>
  );
}
