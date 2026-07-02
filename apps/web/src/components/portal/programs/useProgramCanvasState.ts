"use client";

import type {
  AddExerciseToBlockInput,
  CreateBlockInput,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type { UpdateProgramInput } from "@/src/services/program.service";
import type {
  CreateSessionInput,
  DuplicateSessionInput,
} from "@/src/services/session.service";
import type {
  BlockExerciseRow,
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
  ) => Promise<ActionResult<BlockExerciseRow>>;
  updateBlockExerciseAction: (
    id: string,
    input: UpdateBlockExerciseInput,
  ) => Promise<ActionResult<BlockExerciseRow>>;
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

function firstSessionOfWeek(
  sessions: SessionWithBlocks[],
  week: number,
): SessionWithBlocks | undefined {
  return sessions
    .filter((s) => s.week_number === week)
    .sort((a, b) => a.position - b.position)[0];
}

function useSessionModalHandlers(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  sessionModal: SessionModalState,
  setSessionModal: (state: SessionModalState) => void,
) {
  const router = useRouter();

  function finish(result: { ok: boolean }) {
    if (result.ok) {
      setSessionModal(null);
      router.refresh();
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
      await actions.duplicateSessionAction({
        sourceSessionId: sessionModal.session.id,
        pattern: "manual",
        targetWeeks,
      }),
    );
  }

  async function handleDeleteSession(id: string) {
    const result = await actions.deleteSessionAction(id);
    if (result.ok) router.refresh();
  }

  return {
    handleCreateSession,
    handleRenameSession,
    handleDuplicateSession,
    handleDeleteSession,
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
) {
  const weekBlocks = weekSessions.flatMap((s) => s.blocks);
  const createBlockAction = (sessionId: string, name: string) =>
    actions.createBlockAction({ session_id: sessionId, name });

  const dnd = useBlockExerciseDnd({
    blocks: weekBlocks,
    setBlocks: setWeekBlocks,
    exercisesById,
    addExerciseToBlockAction: actions.addExerciseToBlockAction,
    reorderBlockExercisesAction: actions.reorderBlockExercisesAction,
    reorderBlocksAction: actions.reorderBlocksAction,
    createBlockAction,
  });

  const blockActions = useBlockActions({
    blocks: weekBlocks,
    setBlocks: setWeekBlocks,
    createBlockAction,
    updateBlockAction: actions.updateBlockAction,
    deleteBlockAction: actions.deleteBlockAction,
    updateBlockExerciseAction: actions.updateBlockExerciseAction,
    removeExerciseFromBlockAction: actions.removeExerciseFromBlockAction,
    addExerciseToBlockAction: actions.addExerciseToBlockAction,
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
  selectedWeek: number,
  setSessions: (sessions: SessionWithBlocks[]) => void,
  setFocusedSessionId: (fn: (prev: string | null) => string | null) => void,
) {
  useEffect(() => {
    setSessions(program.sessions);
    setFocusedSessionId((prev) =>
      prev && program.sessions.some((s) => s.id === prev)
        ? prev
        : (firstSessionOfWeek(program.sessions, selectedWeek)?.id ?? null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.sessions]);
}

export function useProgramCanvasState(
  program: ProgramWithSessions,
  exercises: ExerciseWithDetails[],
  actions: ProgramCanvasActions,
) {
  const router = useRouter();
  const [sessions, setSessions] = useState(program.sessions);
  const [selectedWeek, setSelectedWeek] = useState(
    program.sessions[0]?.week_number ?? 1,
  );
  const [focusedSessionId, setFocusedSessionId] = useState<string | null>(
    firstSessionOfWeek(program.sessions, program.sessions[0]?.week_number ?? 1)
      ?.id ?? null,
  );
  const [sessionModal, setSessionModal] = useState<SessionModalState>(null);

  useSyncSessionsFromProgram(
    program,
    selectedWeek,
    setSessions,
    setFocusedSessionId,
  );

  const weekSessions = sessions
    .filter((s) => s.week_number === selectedWeek)
    .sort((a, b) => a.position - b.position);
  const focusedSession =
    sessions.find((s) => s.id === focusedSessionId) ?? null;
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
  );

  function selectWeek(week: number) {
    setSelectedWeek(week);
    setFocusedSessionId(firstSessionOfWeek(sessions, week)?.id ?? null);
  }

  async function addWeek() {
    const newWeekCount = program.weeks + 1;
    const result = await actions.updateProgramAction(program.id, {
      weeks: newWeekCount,
    });
    if (result.ok) {
      router.refresh();
      selectWeek(newWeekCount);
    }
  }

  const sessionModalHandlers = useSessionModalHandlers(
    program,
    actions,
    sessionModal,
    setSessionModal,
  );

  return {
    sessions,
    selectedWeek,
    selectWeek,
    addWeek,
    weekSessions,
    focusedSession,
    focusedSessionId,
    setFocusedSessionId,
    exercisesById,
    dnd,
    blockActions,
    sessionModal,
    setSessionModal,
    ...sessionModalHandlers,
  };
}
