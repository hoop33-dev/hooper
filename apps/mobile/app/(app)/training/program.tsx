import { SessionRow } from "@/src/components/training/SessionRow";
import {
  BackButton,
  Button,
  Caption,
  H3,
  H4,
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
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

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

/** [min, max] sessions across weeks that have at least one session, as a
 * single reusable label ("4" when uniform, "3-4" otherwise). */
function sessionsPerWeekLabel(sessions: AthleteSessionListItem[]): string {
  const counts = new Map<number, number>();
  for (const s of sessions)
    counts.set(s.weekNumber, (counts.get(s.weekNumber) ?? 0) + 1);
  const values = [...counts.values()];
  if (values.length === 0) return "—";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? String(min) : `${min}-${max}`;
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
  perWeek,
}: {
  program: ProgramRow;
  completedCount: number;
  totalCount: number;
  perWeek: string;
}) {
  return (
    <View className="bg-brand-orange mx-5 mb-4 rounded-2xl px-5 py-5">
      <H3 className="mb-3">{program.name}</H3>
      <View className="flex-row gap-6">
        {[
          ["Weeks", String(program.weeks)],
          ["Per week", perWeek],
          ["Done", `${completedCount}/${totalCount}`],
        ].map(([label, value]) => (
          <View key={label}>
            <H4>{value}</H4>
            <Caption className="uppercase">{label}</Caption>
          </View>
        ))}
      </View>
    </View>
  );
}

function SessionWeekList({
  sessions,
  startingSessionId,
  onSessionPress,
}: {
  sessions: AthleteSessionListItem[];
  startingSessionId: string | null;
  onSessionPress: (session: AthleteSessionListItem) => void;
}) {
  if (sessions.length === 0)
    return <Caption className="text-center">No sessions yet.</Caption>;
  return (
    <>
      {groupByWeek(sessions).map(([weekNumber, weekSessions]) => (
        <View key={weekNumber} className="mb-5">
          <Overline className="mb-2.5">Week {weekNumber}</Overline>
          {weekSessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isStarting={startingSessionId === session.id}
              onPress={() => onSessionPress(session)}
            />
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

  async function handleSessionPress(session: AthleteSessionListItem) {
    if (!profile || !program || startingSessionId) return;
    setStartingSessionId(session.id);
    try {
      await navigateToSession(router, session, program, profile.id);
    } finally {
      setStartingSessionId(null);
    }
  }

  const isStartingCurrent =
    !!currentSession && startingSessionId === currentSession.id;

  return (
    <View className="bg-surface flex-1">
      <View className="px-5 pt-[58px] pb-3">
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
            perWeek={sessionsPerWeekLabel(sessions)}
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            className="px-5">
            <SessionWeekList
              sessions={sessions}
              startingSessionId={startingSessionId}
              onSessionPress={handleSessionPress}
            />
          </ScrollView>
          <View className="border-border-subtle border-t px-5 pt-3 pb-8">
            <Button
              variant="primary"
              size="lg"
              disabled={!currentSession || !!startingSessionId}
              onPress={() =>
                currentSession && handleSessionPress(currentSession)
              }>
              {isStartingCurrent ? (
                <ActivityIndicator color="#fff" />
              ) : currentSession ? (
                `Start session ${currentSession.position + 1}`
              ) : (
                "All sessions complete"
              )}
            </Button>
          </View>
        </>
      )}
    </View>
  );
}
