import { BlockContent } from "@/src/components/training/BlockContent";
import { BlockProgressHeader } from "@/src/components/training/BlockProgressHeader";
import { BlockTabs } from "@/src/components/training/BlockTabs";
import { PauseOverlay } from "@/src/components/training/PauseOverlay";
import { SessionFooterNav } from "@/src/components/training/SessionFooterNav";
import { SessionProgressBar } from "@/src/components/training/SessionProgressBar";
import { ExitGuardSheet } from "@/src/components/ui/ExitGuardSheet";
import { colors } from "@/src/constants/theme";
import { useExitGuard } from "@/src/hooks/useExitGuard";
import {
  isBlockDone,
  useSessionPlayer,
  type SetsByBlockExercise,
} from "@/src/hooks/useSessionPlayer";
import { useAuthStore } from "@/src/stores/auth.store";
import type { AthleteSessionDetail } from "@hooper/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

function countSets(
  session: AthleteSessionDetail,
  setsState: SetsByBlockExercise,
) {
  let doneSets = 0;
  let totalSets = 0;
  for (const block of session.blocks) {
    for (const be of block.exercises) {
      totalSets += be.sets;
      doneSets += (setsState[be.id] ?? []).filter((s) => s.done).length;
    }
  }
  return { doneSets, totalSets };
}

export default function SessionPlayerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const player = useSessionPlayer(sessionId, profile?.id);
  const exitGuard = useExitGuard();

  const { session, completion, blockIdx, setsState } = player;
  const curBlock = session?.blocks[blockIdx] ?? null;
  const blockScrollX = useSharedValue(0);

  function handleComplete() {
    if (!completion || !session) return;
    router.replace({
      pathname: "/(app)/training/complete",
      params: { sessionCompletionId: completion.id, sessionId: session.id },
    });
  }

  if (!session || !curBlock || !completion) {
    return (
      <View className="bg-surface flex-1 items-center justify-center">
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  const doneFlags = session.blocks.map((b) => isBlockDone(b, setsState));
  const { doneSets, totalSets } = countSets(session, setsState);

  return (
    <View className="bg-surface flex-1">
      <BlockProgressHeader
        blockCount={session.blocks.length}
        blockIdx={blockIdx}
        doneFlags={doneFlags}
        paused={player.paused}
        pausing={player.pausing}
        onTogglePause={player.togglePause}
        onExit={exitGuard.requestExit}
      />
      <SessionProgressBar doneSets={doneSets} totalSets={totalSets} />
      <BlockTabs
        blocks={session.blocks}
        doneFlags={doneFlags}
        onSelect={player.setBlockIdx}
        scrollX={blockScrollX}
      />
      <BlockContent
        blocks={session.blocks}
        blockIdx={blockIdx}
        setsByBlockExercise={setsState}
        onValueChange={player.setFieldValue}
        onSetDone={player.markSetDone}
        onBlockIdxChange={player.setBlockIdx}
        scrollX={blockScrollX}
      />
      <SessionFooterNav
        canGoPrev={blockIdx > 0}
        isLastBlock={blockIdx === session.blocks.length - 1}
        onPrev={() => player.goBlock(-1)}
        onNext={() => player.goBlock(1)}
        onComplete={handleComplete}
      />
      {player.paused ? <PauseOverlay onResume={player.togglePause} /> : null}
      <ExitGuardSheet
        visible={exitGuard.visible}
        title="EXIT SESSION?"
        message={`You've logged ${doneSets} of ${totalSets} sets. Your progress is saved, but the session stays unfinished.`}
        confirmLabel="Exit session"
        cancelLabel="Keep training"
        confirmAccent={colors.brandOrange}
        onConfirm={exitGuard.confirmExit}
        onCancel={exitGuard.cancelExit}
      />
    </View>
  );
}
