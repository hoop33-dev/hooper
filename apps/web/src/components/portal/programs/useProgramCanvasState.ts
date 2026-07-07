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
import type { CreateSessionFromTemplateInput } from "@/src/services/sessionTemplate.service";
import type {
  BlockExerciseWithDetails,
  BlockRow,
  BlockWithExercises,
  ExerciseWithDetails,
  ProgramRow,
  ProgramWithSessions,
  SessionRow,
  SessionTemplateSummary,
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
  deleteProgramWeekAction: (
    programId: string,
    weekNumber: number,
  ) => Promise<ActionResult<ProgramRow>>;
  /** Only needed to power the block header's "Save as template" button. */
  saveBlockAsTemplateAction?: (
    blockId: string,
    name: string,
  ) => Promise<ActionResult>;
  /** Only needed to power the session column's "Save as template" button. */
  saveSessionAsTemplateAction?: (
    sessionId: string,
    name: string,
  ) => Promise<ActionResult>;
  /** Only needed to power dragging a Block Library template into a block. */
  createBlockFromTemplateAction?: (input: {
    session_id: string;
    block_template_id: string;
  }) => Promise<ActionResult<BlockWithExercises>>;
  /** Only needed to power dragging a multi-block Block Library template into
   * a session. */
  createBlocksFromSessionTemplateAction?: (input: {
    session_id: string;
    session_template_id: string;
  }) => Promise<ActionResult<BlockWithExercises[]>>;
  /** Only needed to power "+ Add session > From template". */
  createSessionFromTemplateAction?: (
    input: CreateSessionFromTemplateInput,
  ) => Promise<ActionResult<SessionRow>>;
}

export type SessionModalState =
  | { type: "create"; weekNumber: number }
  | { type: "rename"; session: SessionWithBlocks }
  | { type: "duplicate"; session: SessionWithBlocks }
  | { type: "saveAsTemplate"; session: SessionWithBlocks }
  | null;

/** Resolves the create-session request against whichever backing action its
 * mode calls for — a blank session, a copy of an existing one, or a copy of
 * a Block Library template. */
async function resolveCreateSession(
  data: SessionCreateData,
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
): Promise<{ ok: boolean; error?: string }> {
  if (data.mode === "template") {
    if (!actions.createSessionFromTemplateAction) return { ok: false };
    return actions.createSessionFromTemplateAction({
      session_template_id: data.sessionTemplateId,
      program_id: program.id,
      week_number: data.week_number,
    });
  }
  if (data.mode === "blank") {
    return actions.createSessionAction({
      program_id: program.id,
      week_number: data.week_number,
      name: data.name,
    });
  }
  return actions.duplicateSessionAction({
    sourceSessionId: data.sourceSessionId,
    pattern: "manual",
    targetWeeks: [data.week_number],
  });
}

async function runSaveSessionAsTemplate(
  name: string,
  sessionModal: SessionModalState,
  saveSessionAsTemplateAction: ProgramCanvasActions["saveSessionAsTemplateAction"],
  onDone: () => void,
  showError: (message: string) => void,
  showSuccess: (message: string) => void,
) {
  if (sessionModal?.type !== "saveAsTemplate" || !saveSessionAsTemplateAction)
    return;
  const result = await saveSessionAsTemplateAction(
    sessionModal.session.id,
    name,
  );
  if (result.ok) {
    onDone();
    showSuccess(`Saved "${name}" to the Block Library.`);
  } else {
    showError(result.error ?? "Something went wrong.");
  }
}

function useSessionModalHandlers(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  sessionModal: SessionModalState,
  setSessionModal: (state: SessionModalState) => void,
) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  function finish(result: { ok: boolean; error?: string }) {
    if (result.ok) {
      setSessionModal(null);
      router.refresh();
    } else {
      showError(result.error ?? "Something went wrong.");
    }
  }

  async function handleCreateSession(data: SessionCreateData) {
    finish(await resolveCreateSession(data, program, actions));
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

  async function handleSaveSessionAsTemplate(name: string) {
    await runSaveSessionAsTemplate(
      name,
      sessionModal,
      actions.saveSessionAsTemplateAction,
      () => setSessionModal(null),
      showError,
      showSuccess,
    );
  }

  return {
    handleCreateSession,
    handleRenameSession,
    handleDuplicateSession,
    handleDeleteSession,
    handleSaveSessionAsTemplate,
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
  blockTemplateNamesById: Map<string, string>,
  sessionTemplatesById: Map<string, SessionTemplateSummary>,
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
    createBlockFromTemplateAction: actions.createBlockFromTemplateAction,
    createBlocksFromSessionTemplateAction:
      actions.createBlocksFromSessionTemplateAction,
    blockTemplateNamesById,
    sessionTemplatesById,
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
    saveBlockAsTemplateAction: actions.saveBlockAsTemplateAction,
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

/** Patches only the sessions visible in the current week — dnd/block-action
 * state spans every visible session's blocks (see useCanvasBlockState), so
 * a single flat blocks array has to be redistributed back across them. */
function patchWeekBlocks(
  prevSessions: SessionWithBlocks[],
  weekSessionIds: Set<string>,
  blocks: BlockWithExercises[],
): SessionWithBlocks[] {
  return prevSessions.map((s) =>
    weekSessionIds.has(s.id)
      ? { ...s, blocks: blocks.filter((b) => b.session_id === s.id) }
      : s,
  );
}

async function runAddWeek(
  program: ProgramWithSessions,
  updateProgramAction: ProgramCanvasActions["updateProgramAction"],
  onSuccess: (newWeekCount: number) => void,
  showError: (message: string) => void,
) {
  const newWeekCount = program.weeks + 1;
  const result = await updateProgramAction(program.id, {
    weeks: newWeekCount,
  });
  if (result.ok) onSuccess(newWeekCount);
  else showError(result.error ?? "Something went wrong.");
}

/** Which week should end up selected after `deletedWeek` is removed — every
 * week after it shifts down by one, so a selection past it must shift too,
 * while a selection on it falls back to the week now in its place (clamped
 * to 1, since a deleted week 1 leaves the new week 1 behind it). */
export function selectWeekAfterDelete(
  deletedWeek: number,
  currentSelected: number,
): number {
  if (currentSelected < deletedWeek) return currentSelected;
  return Math.max(1, currentSelected - 1);
}

async function runDeleteWeek(
  program: ProgramWithSessions,
  weekNumber: number,
  deleteProgramWeekAction: ProgramCanvasActions["deleteProgramWeekAction"],
  onSuccess: () => void,
  showError: (message: string) => void,
) {
  const result = await deleteProgramWeekAction(program.id, weekNumber);
  if (result.ok) onSuccess();
  else showError(result.error ?? "Something went wrong.");
}

function useWeekHandlers(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  selectedWeek: number,
  selectWeek: (week: number) => void,
  router: ReturnType<typeof useRouter>,
  showError: (message: string) => void,
) {
  async function addWeek() {
    await runAddWeek(
      program,
      actions.updateProgramAction,
      (newWeekCount) => {
        router.refresh();
        selectWeek(newWeekCount);
      },
      showError,
    );
  }

  async function deleteWeek(weekNumber: number) {
    await runDeleteWeek(
      program,
      weekNumber,
      actions.deleteProgramWeekAction,
      () => {
        router.refresh();
        selectWeek(selectWeekAfterDelete(weekNumber, selectedWeek));
      },
      showError,
    );
  }

  return { addWeek, deleteWeek };
}

/** Two lookups derived from the same sessionTemplates list — block names
 * keyed by block_template id (single-block drops) and full summaries keyed
 * by session_template id (multi-block drops) — see useBlockExerciseDnd.ts. */
function buildTemplateLookups(sessionTemplates: SessionTemplateSummary[]) {
  return {
    blockTemplateNamesById: new Map(
      sessionTemplates.flatMap((t) => t.blocks).map((b) => [b.id, b.name]),
    ),
    sessionTemplatesById: new Map(sessionTemplates.map((t) => [t.id, t])),
  };
}

export function useProgramCanvasState(
  program: ProgramWithSessions,
  exercises: ExerciseWithDetails[],
  actions: ProgramCanvasActions,
  sessionTemplates: SessionTemplateSummary[] = [],
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
  const { blockTemplateNamesById, sessionTemplatesById } =
    buildTemplateLookups(sessionTemplates);

  function setWeekBlocks(blocks: BlockWithExercises[]) {
    const weekSessionIds = new Set(weekSessions.map((s) => s.id));
    setSessions((prev) => patchWeekBlocks(prev, weekSessionIds, blocks));
  }

  const { dnd, blockActions } = useCanvasBlockState(
    weekSessions,
    actions,
    setWeekBlocks,
    exercisesById,
    blockTemplateNamesById,
    sessionTemplatesById,
    router,
  );

  function selectWeek(week: number) {
    setSelectedWeek(week);
  }

  const { addWeek, deleteWeek } = useWeekHandlers(
    program,
    actions,
    selectedWeek,
    selectWeek,
    router,
    showError,
  );

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
    deleteWeek,
    weekSessions,
    exercisesById,
    blockTemplateNamesById,
    sessionTemplatesById,
    sessionTemplates,
    dnd,
    blockActions,
    sessionModal,
    setSessionModal,
    linkedWeeksForSessionModal,
    linkedWeeksForEditingExercise,
    ...sessionModalHandlers,
  };
}
