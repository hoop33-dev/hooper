import {
  BlockContent,
  type BlockPagerHandle,
} from "@/src/components/training/BlockContent";
import { BlockProgressHeader } from "@/src/components/training/BlockProgressHeader";
import { BlockTabs } from "@/src/components/training/BlockTabs";
import { PauseOverlay } from "@/src/components/training/PauseOverlay";
import { SessionFooterNav } from "@/src/components/training/SessionFooterNav";
import { SessionProgressBar } from "@/src/components/training/SessionProgressBar";
import { SetActionsProvider } from "@/src/components/training/SetActionsContext";
import { ValueEditorHost } from "@/src/components/training/ValueEditorHost";
import { Button, Caption } from "@/src/components/ui";
import { ExitGuardSheet } from "@/src/components/ui/ExitGuardSheet";
import { colors } from "@/src/constants/theme";
import { useAutoFinalizeSession } from "@/src/hooks/useAutoFinalizeSession";
import { useExitGuard } from "@/src/hooks/useExitGuard";
import {
  isBlockDone,
  useSessionPlayer,
  type SetsByBlockExercise,
} from "@/src/hooks/useSessionPlayer";
import { useAuthStore } from "@/src/stores/auth.store";
import type { AthleteSessionDetail } from "@hooper/api";
import type { SessionCompletionRow } from "@hooper/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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

/** Drives the "Complete session" footer button: completing early (with
 * unlogged sets remaining) confirms first, completing with everything
 * logged skips straight through. Either way, navigation goes through
 * `exitGuard.allowLeave()` first — otherwise the exit guard's
 * `beforeRemove` listener intercepts this navigation the same as a
 * back/exit and shows the exit-session sheet instead. */
function useCompleteSessionFlow(
  player: {
    session: AthleteSessionDetail | null;
    completion: SessionCompletionRow | null;
    setsState: SetsByBlockExercise;
  },
  exitGuard: ReturnType<typeof useExitGuard>,
) {
  const { session, completion, setsState } = player;
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  function goToCompleteScreen() {
    if (!completion || !session) return;
    exitGuard.allowLeave();
    router.replace({
      pathname: "/(app)/training/complete",
      params: { sessionCompletionId: completion.id, sessionId: session.id },
    });
  }

  function handleComplete() {
    if (!completion || !session) return;
    const { doneSets, totalSets } = countSets(session, setsState);
    if (doneSets < totalSets) {
      setShowConfirm(true);
      return;
    }
    goToCompleteScreen();
  }

  function confirmComplete() {
    setShowConfirm(false);
    goToCompleteScreen();
  }

  return {
    showConfirm,
    handleComplete,
    confirmComplete,
    cancelComplete: () => setShowConfirm(false),
  };
}

/** The two "are you sure" sheets on the player — exiting mid-session, and
 * completing with sets still unlogged. Pulled out to keep the screen lean. */
function PlayerConfirmSheets({
  loggedLabel,
  exitGuard,
  completeFlow,
}: {
  loggedLabel: string;
  exitGuard: ReturnType<typeof useExitGuard>;
  completeFlow: ReturnType<typeof useCompleteSessionFlow>;
}) {
  return (
    <>
      <ExitGuardSheet
        visible={exitGuard.visible}
        title="EXIT SESSION?"
        message={`You've logged ${loggedLabel}. Your progress is saved, but the session stays unfinished.`}
        confirmLabel="Exit session"
        cancelLabel="Keep training"
        confirmAccent={colors.brandOrange}
        onConfirm={exitGuard.confirmExit}
        onCancel={exitGuard.cancelExit}
      />
      <ExitGuardSheet
        visible={completeFlow.showConfirm}
        title="Complete session?"
        message={`You've logged ${loggedLabel}. Doing this will complete the session.`}
        confirmLabel="Complete session"
        cancelLabel="Keep training"
        confirmAccent={colors.success}
        onConfirm={completeFlow.confirmComplete}
        onCancel={completeFlow.cancelComplete}
      />
    </>
  );
}

/** Per-block done flags + overall set counts, derived once per sets-state
 * change. `doneFlags` keeps its previous identity while no block's flag
 * flipped, so the memoised tab bar skips the (common) tick that doesn't
 * finish a block. */
function usePlayerProgress(
  session: AthleteSessionDetail | null,
  setsState: SetsByBlockExercise,
) {
  const prevFlags = useRef<boolean[]>([]);
  return useMemo(() => {
    if (!session)
      return { doneFlags: prevFlags.current, doneSets: 0, totalSets: 0 };
    const flags = session.blocks.map((b) => isBlockDone(b, setsState));
    const prev = prevFlags.current;
    const same =
      prev.length === flags.length && flags.every((f, i) => f === prev[i]);
    if (!same) prevFlags.current = flags;
    return { doneFlags: prevFlags.current, ...countSets(session, setsState) };
  }, [session, setsState]);
}

/** Progress, the auto-complete on the last logged set, and the exit guard —
 * grouped because the guard depends on both. */
function usePlayerCompletionState(player: ReturnType<typeof useSessionPlayer>) {
  const progress = usePlayerProgress(player.session, player.setsState);
  const finalized = useAutoFinalizeSession(
    player.completion?.id,
    progress.doneSets,
    progress.totalSets,
  );
  // Only guard the exit once the session has loaded — the spinner/error
  // branches render no ExitGuardSheet, so a guard there blocks Back silently.
  // And not once every set is logged: the attempt is then already completed
  // server-side, so there's no "stays unfinished" to warn about.
  const exitGuard = useExitGuard(
    !!player.session && !player.loadError && !finalized,
  );
  return { ...progress, exitGuard };
}

/** Moves to a block from a tab tap / footer press: starts the pager's slide
 * immediately, then updates `blockIdx` (so the slide isn't held up behind
 * the re-render that follows). */
function useBlockSelection(
  blockCount: number,
  blockIdx: number,
  setBlockIdx: (i: number) => void,
) {
  const pagerRef = useRef<BlockPagerHandle>(null);
  const selectBlock = useCallback(
    (index: number) => {
      const clamped = Math.min(blockCount - 1, Math.max(0, index));
      pagerRef.current?.scrollToBlock(clamped);
      setBlockIdx(clamped);
    },
    [blockCount, setBlockIdx],
  );
  return {
    pagerRef,
    selectBlock,
    goPrev: () => selectBlock(blockIdx - 1),
    goNext: () => selectBlock(blockIdx + 1),
  };
}

function PlayerLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="bg-surface flex-1 items-center justify-center px-8">
      <Caption className="mb-4 text-center">
        Couldn&apos;t load this session.
      </Caption>
      <Button variant="primary" size="md" onPress={onRetry}>
        Try again
      </Button>
    </View>
  );
}

export default function SessionPlayerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const profile = useAuthStore((s) => s.profile);
  const player = useSessionPlayer(sessionId, profile?.id);
  const { doneFlags, doneSets, totalSets, exitGuard } =
    usePlayerCompletionState(player);
  const completeFlow = useCompleteSessionFlow(player, exitGuard);
  const { session, completion, blockIdx, setsState } = player;
  const curBlock = session?.blocks[blockIdx] ?? null;
  const blockScrollX = useSharedValue(0);
  const nav = useBlockSelection(
    session?.blocks.length ?? 0,
    blockIdx,
    player.setBlockIdx,
  );

  if (player.loadError) {
    return <PlayerLoadError onRetry={player.retryLoad} />;
  }

  if (!session || !curBlock || !completion) {
    return (
      <View className="bg-surface flex-1 items-center justify-center">
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <SetActionsProvider value={player.setActions}>
      <ValueEditorHost>
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
            onSelect={nav.selectBlock}
            scrollX={blockScrollX}
          />
          <BlockContent
            blocks={session.blocks}
            blockIdx={blockIdx}
            setsByBlockExercise={setsState}
            onBlockIdxChange={player.setBlockIdx}
            scrollX={blockScrollX}
            pagerRef={nav.pagerRef}
          />
          <SessionFooterNav
            canGoPrev={blockIdx > 0}
            isLastBlock={blockIdx === session.blocks.length - 1}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onComplete={completeFlow.handleComplete}
          />
          {player.paused ? (
            <PauseOverlay onResume={player.togglePause} />
          ) : null}
          <PlayerConfirmSheets
            loggedLabel={`${doneSets} of ${totalSets} sets`}
            exitGuard={exitGuard}
            completeFlow={completeFlow}
          />
        </View>
      </ValueEditorHost>
    </SetActionsProvider>
  );
}
