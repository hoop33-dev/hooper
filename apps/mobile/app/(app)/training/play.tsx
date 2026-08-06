import { BlockContent } from "@/src/components/training/BlockContent";
import { BlockProgressHeader } from "@/src/components/training/BlockProgressHeader";
import { BlockTabs } from "@/src/components/training/BlockTabs";
import { PauseOverlay } from "@/src/components/training/PauseOverlay";
import { SessionFooterNav } from "@/src/components/training/SessionFooterNav";
import { SetValueSheet } from "@/src/components/training/SetValueSheet";
import { colors } from "@/src/constants/theme";
import { isBlockDone, useSessionPlayer } from "@/src/hooks/useSessionPlayer";
import { useAuthStore } from "@/src/stores/auth.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, View } from "react-native";

export default function SessionPlayerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const player = useSessionPlayer(sessionId, profile?.id);

  const { session, completion, blockIdx, setsState } = player;
  const curBlock = session?.blocks[blockIdx] ?? null;

  function handleComplete() {
    if (!completion || !session) return;
    router.replace({
      pathname: "/(app)/training/complete",
      params: { sessionCompletionId: completion.id, sessionId: session.id },
    });
  }

  function handleExit() {
    Alert.alert(
      "Exit workout?",
      "Your progress is saved — you can pick up where you left off.",
      [
        { text: "Keep going", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => router.back() },
      ],
    );
  }

  if (!session || !curBlock || !completion) {
    return (
      <View className="bg-surface flex-1 items-center justify-center">
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  const doneFlags = session.blocks.map((b) => isBlockDone(b, setsState));

  return (
    <View className="bg-surface flex-1">
      <BlockProgressHeader
        blockCount={session.blocks.length}
        blockIdx={blockIdx}
        doneFlags={doneFlags}
        paused={player.paused}
        pausing={player.pausing}
        onTogglePause={player.togglePause}
        onExit={handleExit}
      />
      <BlockTabs
        blocks={session.blocks}
        blockIdx={blockIdx}
        doneFlags={doneFlags}
        onSelect={player.setBlockIdx}
      />
      <BlockContent
        block={curBlock}
        setsByBlockExercise={setsState}
        onFieldTap={player.openField}
        onSetDone={player.markSetDone}
      />
      <SessionFooterNav
        canGoPrev={blockIdx > 0}
        isLastBlock={blockIdx === session.blocks.length - 1}
        onPrev={() => player.goBlock(-1)}
        onNext={() => player.goBlock(1)}
        onComplete={handleComplete}
      />
      {player.paused ? <PauseOverlay onResume={player.togglePause} /> : null}
      <SetValueSheet
        visible={!!player.sheet}
        exerciseName={player.sheet?.exerciseName ?? ""}
        unitType={player.sheet?.unitType ?? ""}
        initialValue={player.sheet?.currentValue ?? null}
        onConfirm={player.confirmField}
        onClose={player.closeSheet}
      />
    </View>
  );
}
