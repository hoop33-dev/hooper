import { ContinueRestartSheet } from "@/src/components/training/ContinueRestartSheet";
import { ExerciseMediaThumbnail } from "@/src/components/training/ExerciseMediaThumbnail";
import { PlayIcon } from "@/src/components/training/icons";
import { ExerciseMediaViewer } from "@/src/components/training/videoPlayer/ExerciseMediaViewer";
import {
  BackButton,
  BodySm,
  Button,
  Caption,
  Hero,
  Lead,
  MicroLabel,
  Overline,
  RowTitle,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useSessionLauncher } from "@/src/hooks/useSessionLauncher";
import {
  groupSetsByVariant,
  resolveGroupStyle,
} from "@/src/lib/blockExerciseDisplay";
import { exerciseMediaItems } from "@/src/lib/exerciseMedia";
import {
  formatPrescription,
  sessionTotals,
} from "@/src/lib/measurementSummary";
import { getProgramForm } from "@/src/services/formResponse.service";
import {
  getProgram,
  getSessionDetail,
  type AthleteBlock,
  type AthleteBlockExercise,
  type AthleteExercise,
  type AthleteSessionDetail,
} from "@/src/services/program.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { ProgramRow } from "@hooper/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type PreviewData = {
  session: AthleteSessionDetail;
  program: ProgramRow;
  /** Question count of the program's check-in form, null without one. */
  formQuestionCount: number | null;
};

/** Loads everything the preview shows. Nothing here creates a session
 * completion — that only happens once the athlete presses start. */
function usePreviewData(sessionId: string, programId: string) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!sessionId || !programId) return;
    let cancelled = false;
    setLoadError(false);
    async function load() {
      try {
        const [session, program, form] = await Promise.all([
          getSessionDetail(sessionId),
          getProgram(programId),
          getProgramForm(programId),
        ]);
        if (cancelled) return;
        setData({
          session,
          program,
          formQuestionCount: form ? form.questions.length : null,
        });
      } catch (e) {
        if (cancelled) return;
        console.warn("Failed to load session preview", e);
        setLoadError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, programId, reloadKey]);

  return { data, loadError, retry: () => setReloadKey((k) => k + 1) };
}

function StatsStrip({ session }: { session: AthleteSessionDetail }) {
  const totals = sessionTotals(session);
  const cells: [string, number][] = [
    ["Blocks", totals.blocks],
    ["Exercises", totals.exercises],
    ["Sets", totals.sets],
  ];
  return (
    <View className="bg-surface-2 border-border-subtle flex-row overflow-hidden rounded-2xl border">
      {cells.map(([label, value], i) => (
        <View
          key={label}
          className="flex-1 items-center px-2.5 py-3"
          style={{
            borderRightWidth: i < cells.length - 1 ? 1 : 0,
            borderRightColor: colors.borderSubtle,
          }}>
          <Hero>{value}</Hero>
          <MicroLabel className="mt-1.5">{label}</MicroLabel>
        </View>
      ))}
    </View>
  );
}

function blockMeta(block: AthleteBlock): string {
  if (block.is_superset) {
    const rounds = block.sets ?? block.exercises[0]?.sets ?? 0;
    return `Superset, ${rounds} round${rounds === 1 ? "" : "s"}`;
  }
  const n = block.exercises.length;
  return `${n} exercise${n === 1 ? "" : "s"}`;
}

function ExerciseRow({
  blockExercise,
  exercise,
  setIndices,
  superset,
  isLast,
}: {
  blockExercise: AthleteBlockExercise;
  exercise: AthleteExercise;
  setIndices: number[];
  /** In a superset the round count lives on the block header. */
  superset: boolean;
  isLast: boolean;
}) {
  const media = useMemo(() => exerciseMediaItems(exercise), [exercise]);
  const [viewerStart, setViewerStart] = useState<number | null>(null);
  const prescription = formatPrescription(blockExercise, setIndices, superset);
  const style = resolveGroupStyle(blockExercise, setIndices);

  return (
    <View
      className="flex-row items-center gap-3 py-2.5"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}>
      <ExerciseMediaThumbnail items={media} onOpen={setViewerStart} />
      <View className="flex-1">
        <RowTitle>{exercise.name}</RowTitle>
        {prescription ? (
          <BodySm className="mt-0.5">{prescription}</BodySm>
        ) : null}
        {style ? (
          <Caption className="text-brand-orange mt-0.5">
            {style.uniform ? style.name : "Style varies by set"}
          </Caption>
        ) : null}
      </View>
      <ExerciseMediaViewer
        startIndex={viewerStart}
        onClose={() => setViewerStart(null)}
        items={media}
        title={exercise.name}
        cue={exercise.description}
      />
    </View>
  );
}

function BlockSection({ block }: { block: AthleteBlock }) {
  const rows = block.exercises.flatMap((be) =>
    groupSetsByVariant(be).map((group, groupIndex) => ({
      key: `${be.id}-${groupIndex}`,
      be,
      group,
    })),
  );
  return (
    <View className="mt-6">
      <View className="mb-2.5 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <View
            className="h-3.5 w-[3px] rounded-full"
            style={{ backgroundColor: colors.brandOrange }}
          />
          <Lead className="text-brand-orange flex-1" numberOfLines={1}>
            {block.name}
          </Lead>
        </View>
        <Caption>{blockMeta(block)}</Caption>
      </View>
      <View className="bg-surface-2 border-border-subtle rounded-2xl border px-3.5 py-1">
        {rows.map(({ key, be, group }, i) => (
          <ExerciseRow
            key={key}
            blockExercise={be}
            exercise={group.exercise}
            setIndices={group.setIndices}
            superset={block.is_superset}
            isLast={i === rows.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function CheckInIcon() {
  return (
    <Svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.textTertiary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M9 11l3 3 8-8" />
      <Path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

/** Sticky CTA. With a check-in form, says so before the athlete taps. */
function PreviewFooter({
  formQuestionCount,
  starting,
  onStart,
}: {
  formQuestionCount: number | null;
  starting: boolean;
  onStart: () => void;
}) {
  const hasForm = formQuestionCount !== null;
  return (
    <View className="border-border-subtle bg-surface border-t px-5 pt-3 pb-8">
      {formQuestionCount ? (
        <View className="mb-2.5 flex-row items-center justify-center gap-1.5">
          <CheckInIcon />
          <Caption>
            Quick check-in first, {formQuestionCount} question
            {formQuestionCount === 1 ? "" : "s"}
          </Caption>
        </View>
      ) : null}
      <Button
        variant="primary"
        size="lg"
        disabled={starting}
        icon={<PlayIcon size={12} color="#fff" />}
        onPress={onStart}>
        {starting ? (
          <ActivityIndicator color="#fff" />
        ) : hasForm ? (
          "Continue"
        ) : (
          "Start session"
        )}
      </Button>
    </View>
  );
}

function PreviewBody({ data }: { data: PreviewData }) {
  const { session } = data;
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      className="flex-1">
      <Overline className="text-brand-orange mb-1.5">
        Session {session.position + 1}
      </Overline>
      <Hero className="mb-4">{session.name}</Hero>
      <StatsStrip session={session} />
      {session.blocks.map((block) => (
        <BlockSection key={block.id} block={block} />
      ))}
    </ScrollView>
  );
}

export default function SessionPreviewScreen() {
  const { sessionId, programId } = useLocalSearchParams<{
    sessionId: string;
    programId: string;
  }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data, loadError, retry } = usePreviewData(sessionId, programId);
  const launcher = useSessionLauncher(
    sessionId,
    data?.program ?? null,
    profile?.id,
  );

  return (
    <View className="bg-surface flex-1">
      <View className="px-5 pt-[58px] pb-4">
        <BackButton
          label={data ? `Week ${data.session.week_number}` : "Back"}
          onPress={() => router.back()}
          className="mb-0"
        />
      </View>
      {loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Lead className="mb-4 text-center">
            Couldn&apos;t load this session.
          </Lead>
          <Button variant="primary" size="md" onPress={retry}>
            Try again
          </Button>
        </View>
      ) : !data ? (
        <ActivityIndicator
          color={colors.textTertiary}
          style={{ marginTop: 48 }}
        />
      ) : (
        <>
          <PreviewBody data={data} />
          <PreviewFooter
            formQuestionCount={data.formQuestionCount}
            starting={launcher.starting}
            onStart={launcher.start}
          />
        </>
      )}
      <ContinueRestartSheet
        visible={launcher.pendingResume}
        onContinue={launcher.continueResume}
        onRestart={launcher.restart}
        onCancel={launcher.cancelResume}
      />
    </View>
  );
}
