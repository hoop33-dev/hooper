"use client";

import type {
  AddExerciseToBlockInput,
  CreateBlockInput,
  UpdateBlockExerciseInput,
  UpdateBlockInput,
} from "@/src/services/block.service";
import type {
  CreateSessionInput,
  DuplicateSessionInput,
} from "@/src/services/session.service";
import type {
  BlockExerciseRow,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
  ProgramWithSessions,
  SessionRow,
  SessionWithBlocks,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlockExercisePositionUpdate } from "./dnd/dropComputation";
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

export function useProgramCanvasState(
  program: ProgramWithSessions,
  exercises: ExerciseWithDetails[],
  actions: ProgramCanvasActions,
) {
  const [sessions, setSessions] = useState(program.sessions);
  const [selectedWeek, setSelectedWeek] = useState(
    program.sessions[0]?.week_number ?? 1,
  );
  const [focusedSessionId, setFocusedSessionId] = useState<string | null>(
    firstSessionOfWeek(program.sessions, program.sessions[0]?.week_number ?? 1)
      ?.id ?? null,
  );
  const [sessionModal, setSessionModal] = useState<SessionModalState>(null);

  const weekSessions = sessions
    .filter((s) => s.week_number === selectedWeek)
    .sort((a, b) => a.position - b.position);
  const focusedSession =
    sessions.find((s) => s.id === focusedSessionId) ?? null;
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));

  function setFocusedBlocks(blocks: BlockWithExercises[]) {
    if (!focusedSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === focusedSessionId ? { ...s, blocks } : s)),
    );
  }

  const dnd = useBlockExerciseDnd({
    blocks: focusedSession?.blocks ?? [],
    setBlocks: setFocusedBlocks,
    exercisesById,
    addExerciseToBlockAction: actions.addExerciseToBlockAction,
    reorderBlockExercisesAction: actions.reorderBlockExercisesAction,
  });

  const blockActions = useBlockActions({
    blocks: focusedSession?.blocks ?? [],
    setBlocks: setFocusedBlocks,
    createBlockAction: (name) =>
      actions.createBlockAction({ session_id: focusedSessionId ?? "", name }),
    updateBlockAction: actions.updateBlockAction,
    deleteBlockAction: actions.deleteBlockAction,
    updateBlockExerciseAction: actions.updateBlockExerciseAction,
    removeExerciseFromBlockAction: actions.removeExerciseFromBlockAction,
  });

  function selectWeek(week: number) {
    setSelectedWeek(week);
    setFocusedSessionId(firstSessionOfWeek(sessions, week)?.id ?? null);
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
