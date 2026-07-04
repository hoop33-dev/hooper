"use client";

import type {
  AddExerciseToBlockInput,
  BlockExerciseWithMeasurements,
  CreateBlockInput,
  LinkScope,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type { UpdateProgramInput } from "@/src/services/program.service";
import type {
  CreateSessionInput,
  DuplicateSessionInput,
  SetLinkedWeeksInput,
} from "@/src/services/session.service";
import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
  ProgramRow,
  ProgramWithSessions,
  SessionRow,
  SessionWithBlocks,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "../ui/Toast";
import type {
  BlockExercisePositionUpdate,
  BlockPositionUpdate,
} from "./dnd/dropComputation";
import { useBlockExerciseDnd } from "./dnd/useBlockExerciseDnd";
import type { SessionCreateData } from "./SessionCreateModal";
import { useBlockActions } from "./useBlockActions";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface ProgramCanvasActions {
  createSessionAction: (
    input: CreateSessionInput,
  ) => Promise<ActionResult<SessionRow>>;
  updateSessionNameAction: (
    id: string,
    name: string,
  ) => Promise<ActionResult<SessionRow>>;
  deleteSessionAction: (id: string) => Promise<ActionResult>;
  duplicateSessionAction: (
    input: DuplicateSessionInput,
  ) => Promise<ActionResult<SessionRow[]>>;
  setLinkedWeeksAction: (input: SetLinkedWeeksInput) => Promise<ActionResult>;
  createBlockAction: (
    input: CreateBlockInput,
  ) => Promise<ActionResult<BlockRow>>;
  updateBlockAction: (
    id: string,
    input: UpdateBlockInput,
  ) => Promise<ActionResult<BlockRow>>;
  deleteBlockAction: (id: string) => Promise<ActionResult>;
  reorderBlocksAction: (
    updates: BlockPositionUpdate[],
  ) => Promise<ActionResult>;
  addExerciseToBlockAction: (
    input: AddExerciseToBlockInput,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  updateBlockExerciseAction: (
    id: string,
    input: UpdateBlockExerciseInput,
    scope?: LinkScope,
  ) => Promise<ActionResult<BlockExerciseWithMeasurements>>;
  removeExerciseFromBlockAction: (id: string) => Promise<ActionResult>;
  reorderBlockExercisesAction: (
    updates: BlockExercisePositionUpdate[],
  ) => Promise<ActionResult>;
  updateProgramAction: (
    id: string,
    input: UpdateProgramInput,
  ) => Promise<ActionResult<ProgramRow>>;
}

export type SessionModalState =
  | { type: "create"; weekNumber: number }
  | { type: "rename"; session: SessionWithBlocks }
  | { type: "duplicate"; session: SessionWithBlocks }
  | null;

function useSessionModalHandlers(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  sessionModal: SessionModalState,
  setSessionModal: (state: SessionModalState) => void,
) {
  const router = useRouter();
  const { showError } = useToast();

  function finish(result: { ok: boolean; error?: string }) {
    if (result.ok) {
      setSessionModal(null);
      router.refresh();
    } else {
      showError(result.error ?? "Something went wrong.");
    }
  }

  async function handleCreateSession(data: SessionCreateData) {
    const result =
      data.mode === "blank"
        ? await actions.createSessionAction({
            program_id: program.id,
            week_number: data.week_number,
            name: data.name,
          })
        : await actions.duplicateSessionAction({
            sourceSessionId: data.sourceSessionId,
            pattern: "manual",
            targetWeeks: [data.week_number],
          });
    finish(result);
  }

  async function handleRenameSession(name: string) {
    if (sessionModal?.type !== "rename") return;
    finish(
      await actions.updateSessionNameAction(sessionModal.session.id, name),
    );
  }

  async function handleDuplicateSession(targetWeeks: number[]) {
    if (sessionModal?.type !== "duplicate") return;
    finish(
      await actions.setLinkedWeeksAction({
        sessionId: sessionModal.session.id,
        targetWeeks,
      }),
    );
  }

  async function handleDeleteSession(id: string) {
    const result = await actions.deleteSessionAction(id);
    if (result.ok) router.refresh();
    else showError(result.error ?? "Something went wrong.");
  }

  return {
    handleCreateSession,
    handleRenameSession,
    handleDuplicateSession,
    handleDeleteSession,
  };
}

/** All weeks a session is currently linked to (including its own), sorted —
 * just its own week if it isn't linked to anything. */
export function linkedWeeksOfSession(
  session: SessionWithBlocks,
  allSessions: SessionWithBlocks[],
): number[] {
  if (!session.link_group_id) return [session.week_number];
  return allSessions
    .filter((s) => s.link_group_id === session.link_group_id)
    .map((s) => s.week_number)
    .sort((a, b) => a - b);
}

/** Every week that has a placement sharing this exercise's link group —
 * undefined when it isn't linked (or the group has shrunk to just itself),
 * so the measurement modal knows not to show a scope choice. */
export function linkedWeeksOfExercise(
  exercise: BlockExerciseWithDetails | null,
  allSessions: SessionWithBlocks[],
): number[] | undefined {
  if (!exercise?.link_group_id) return undefined;
  const weeks = new Set<number>();
  for (const session of allSessions) {
    for (const block of session.blocks) {
      if (
        block.exercises.some((e) => e.link_group_id === exercise.link_group_id)
      ) {
        weeks.add(session.week_number);
      }
    }
  }
  return weeks.size > 1 ? [...weeks].sort((a, b) => a - b) : undefined;
}

/**
 * Block/exercise edits patch local state instantly and never call
 * router.refresh() themselves (that's what makes them feel instant) — but a
 * linked edit also writes to sibling rows in *other* weeks, which aren't in
 * `weekBlocks` and so can't be patched locally. Wraps the action props to
 * trigger a background refresh specifically when the edited block/exercise
 * is linked, keeping that one exception without touching the
 * optimistic-update code in useBlockExerciseDnd.ts/useBlockActions.ts at all.
 */
function useLinkAwareActions(
  weekBlocks: BlockWithExercises[],
  actions: ProgramCanvasActions,
  router: ReturnType<typeof useRouter>,
) {
  function blockLinkGroup(blockId: string): string | null {
    return weekBlocks.find((b) => b.id === blockId)?.link_group_id ?? null;
  }
  function exerciseLinkGroup(exerciseId: string): string | null {
    for (const block of weekBlocks) {
      const match = block.exercises.find((e) => e.id === exerciseId);
      if (match) return match.link_group_id;
    }
    return null;
  }

  function refreshIfLinked<A extends unknown[], R extends { ok: boolean }>(
    action: (...args: A) => Promise<R>,
    isLinked: (...args: A) => boolean,
  ) {
    return async (...args: A) => {
      const result = await action(...args);
      if (result.ok && isLinked(...args)) router.refresh();
      return result;
    };
  }

  // A "this"-scoped save never touches siblings, so it's the one case with
  // nothing to refresh even when the placement is linked.
  async function updateBlockExerciseAction(
    id: string,
    input: UpdateBlockExerciseInput,
    scope: LinkScope = "this",
  ) {
    const result = await actions.updateBlockExerciseAction(id, input, scope);
    if (result.ok && scope !== "this" && exerciseLinkGroup(id) !== null) {
      router.refresh();
    }
    return result;
  }

  return {
    updateBlockAction: refreshIfLinked(
      actions.updateBlockAction,
      (id) => blockLinkGroup(id) !== null,
    ),
    deleteBlockAction: refreshIfLinked(
      actions.deleteBlockAction,
      (id) => blockLinkGroup(id) !== null,
    ),
    addExerciseToBlockAction: refreshIfLinked(
      actions.addExerciseToBlockAction,
      (input) => blockLinkGroup(input.block_id) !== null,
    ),
    removeExerciseFromBlockAction: refreshIfLinked(
      actions.removeExerciseFromBlockAction,
      (id) => exerciseLinkGroup(id) !== null,
    ),
    reorderBlocksAction: refreshIfLinked(
      actions.reorderBlocksAction,
      (updates) => updates.some((u) => blockLinkGroup(u.id) !== null),
    ),
    reorderBlockExercisesAction: refreshIfLinked(
      actions.reorderBlockExercisesAction,
      (updates) => updates.some((u) => exerciseLinkGroup(u.id) !== null),
    ),
    updateBlockExerciseAction,
  };
}

/**
 * Blocks/exercises can be dragged between any session shown in the current
 * week, not just the focused one, so the dnd/block-action state spans every
 * visible session's blocks rather than just the focused session's.
 */
function useCanvasBlockState(
  weekSessions: SessionWithBlocks[],
  actions: ProgramCanvasActions,
  setWeekBlocks: (blocks: BlockWithExercises[]) => void,
  exercisesById: Map<string, ExerciseWithDetails>,
  router: ReturnType<typeof useRouter>,
) {
  const weekBlocks = weekSessions.flatMap((s) => s.blocks);
  const linkAware = useLinkAwareActions(weekBlocks, actions, router);
  const createBlockAction = (sessionId: string, name: string) =>
    actions.createBlockAction({ session_id: sessionId, name });

  const dnd = useBlockExerciseDnd({
    blocks: weekBlocks,
    setBlocks: setWeekBlocks,
    exercisesById,
    addExerciseToBlockAction: linkAware.addExerciseToBlockAction,
    reorderBlockExercisesAction: linkAware.reorderBlockExercisesAction,
    reorderBlocksAction: linkAware.reorderBlocksAction,
    createBlockAction,
  });

  const blockActions = useBlockActions({
    blocks: weekBlocks,
    setBlocks: setWeekBlocks,
    createBlockAction,
    updateBlockAction: linkAware.updateBlockAction,
    deleteBlockAction: linkAware.deleteBlockAction,
    updateBlockExerciseAction: linkAware.updateBlockExerciseAction,
    removeExerciseFromBlockAction: linkAware.removeExerciseFromBlockAction,
    addExerciseToBlockAction: linkAware.addExerciseToBlockAction,
    exercisesById,
  });

  return { dnd, blockActions, weekBlocks };
}

/**
 * `program` is a fresh object every time the server component behind this
 * page re-renders (navigation or router.refresh()), but `sessions` was only
 * seeded from it once on mount. Without this, session create/rename/
 * duplicate/delete — all of which call router.refresh() rather than
 * patching local state — would silently not show up until a hard reload.
 */
function useSyncSessionsFromProgram(
  program: ProgramWithSessions,
  setSessions: (sessions: SessionWithBlocks[]) => void,
) {
  useEffect(() => {
    setSessions(program.sessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.sessions]);
}

export function useProgramCanvasState(
  program: ProgramWithSessions,
  exercises: ExerciseWithDetails[],
  actions: ProgramCanvasActions,
) {
  const router = useRouter();
  const { showError } = useToast();
  const [sessions, setSessions] = useState(program.sessions);
  const [selectedWeek, setSelectedWeek] = useState(
    program.sessions[0]?.week_number ?? 1,
  );
  const [sessionModal, setSessionModal] = useState<SessionModalState>(null);

  useSyncSessionsFromProgram(program, setSessions);

  const weekSessions = sessions
    .filter((s) => s.week_number === selectedWeek)
    .sort((a, b) => a.position - b.position);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));

  function setWeekBlocks(blocks: BlockWithExercises[]) {
    const weekSessionIds = new Set(weekSessions.map((s) => s.id));
    setSessions((prev) =>
      prev.map((s) =>
        weekSessionIds.has(s.id)
          ? { ...s, blocks: blocks.filter((b) => b.session_id === s.id) }
          : s,
      ),
    );
  }

  const { dnd, blockActions } = useCanvasBlockState(
    weekSessions,
    actions,
    setWeekBlocks,
    exercisesById,
    router,
  );

  function selectWeek(week: number) {
    setSelectedWeek(week);
  }

  async function addWeek() {
    const newWeekCount = program.weeks + 1;
    const result = await actions.updateProgramAction(program.id, {
      weeks: newWeekCount,
    });
    if (result.ok) {
      router.refresh();
      selectWeek(newWeekCount);
    } else {
      showError(result.error ?? "Something went wrong.");
    }
  }

  const sessionModalHandlers = useSessionModalHandlers(
    program,
    actions,
    sessionModal,
    setSessionModal,
  );

  const linkedWeeksForSessionModal =
    sessionModal?.type === "duplicate"
      ? linkedWeeksOfSession(sessionModal.session, sessions)
      : [];
  const linkedWeeksForEditingExercise = linkedWeeksOfExercise(
    blockActions.editingExercise,
    sessions,
  );

  return {
    sessions,
    selectedWeek,
    selectWeek,
    addWeek,
    weekSessions,
    exercisesById,
    dnd,
    blockActions,
    sessionModal,
    setSessionModal,
    linkedWeeksForSessionModal,
    linkedWeeksForEditingExercise,
    ...sessionModalHandlers,
  };
}
