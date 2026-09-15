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
import type { CopyProgramWeeksInput } from "@/src/services/programImport.service";
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
  ProgramSummary,
  ProgramWithSessions,
  SessionRow,
  SessionTemplateSummary,
  SessionWithBlocks,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useToast } from "../ui/Toast";
import type {
  BlockExercisePositionUpdate,
  BlockPositionUpdate,
} from "./dnd/dropComputation";
import { createPendingBlock, isPending } from "./dnd/pendingRows";
import {
  useBlockExerciseDnd,
  type SessionPositionUpdate,
} from "./dnd/useBlockExerciseDnd";
import type { SessionCreateData } from "./SessionCreateModal";
import { useBlockActions } from "./useBlockActions";
import { useLibraryPanelState } from "./useLibraryPanelState";

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
  reorderSessionsAction: (
    updates: SessionPositionUpdate[],
  ) => Promise<ActionResult>;
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
  addBlankProgramWeeksAction: (
    programId: string,
    count: number,
  ) => Promise<ActionResult<ProgramRow>>;
  listEligibleImportSourcesAction: (
    destinationProgramId: string,
  ) => Promise<ActionResult<ProgramSummary[]>>;
  getImportSourceProgramAction: (
    programId: string,
  ) => Promise<ActionResult<ProgramWithSessions>>;
  copyProgramWeeksAction: (
    input: CopyProgramWeeksInput,
  ) => Promise<ActionResult<ProgramRow>>;
  duplicateProgramWeeksAction: (
    programId: string,
    weekNumbers: number[],
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
  | {
      type: "create";
      weekNumber: number;
      /** Set when this modal was opened by dropping a library exercise on
       * the "+ Add session" zone — once the session is named, a new block
       * gets created in it and this exercise added to that block. */
      seedExerciseId?: string;
    }
  | { type: "rename"; session: SessionWithBlocks }
  | { type: "duplicate"; session: SessionWithBlocks }
  | { type: "saveAsTemplate"; session: SessionWithBlocks }
  | null;

/** Weeks aren't a stored entity of their own — just a count on the program
 * plus a `week_number` on each session (see program.service.ts) — so a
 * program with zero weeks happily accepts a session for week 1 without that
 * count ever moving, leaving it stuck showing "0 weeks" despite having a
 * session. Bumps the count first so the week a new session lands in
 * actually exists. */
async function ensureWeekExists(
  weekNumber: number,
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
): Promise<{ ok: boolean; error?: string }> {
  if (program.weeks >= weekNumber) return { ok: true };
  return actions.addBlankProgramWeeksAction(
    program.id,
    weekNumber - program.weeks,
  );
}

/** Builds the seeded create-session modal state for a library-exercise drop
 * on the "+ Add session" zone — split out purely to keep the state that
 * builds it under the line-count limit. */
function seededCreateModalState(
  exerciseId: string,
  weekNumber: number,
): SessionModalState {
  return { type: "create", weekNumber, seedExerciseId: exerciseId };
}

/** Creates a blank session, then a first block in it seeded with
 * `exerciseId` — backs dropping a library exercise onto the "+ Add session"
 * zone, where the modal only needs to ask for a name since the block and
 * exercise are already decided. */
async function createSeededSession(
  data: Extract<SessionCreateData, { mode: "blank" }>,
  exerciseId: string,
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
): Promise<{ ok: boolean; error?: string }> {
  const weekResult = await ensureWeekExists(data.week_number, program, actions);
  if (!weekResult.ok) return weekResult;

  const sessionResult = await actions.createSessionAction({
    program_id: program.id,
    week_number: data.week_number,
    name: data.name,
  });
  if (!sessionResult.ok || !sessionResult.data) return sessionResult;

  const blockResult = await actions.createBlockAction({
    session_id: sessionResult.data.id,
    name: "New block",
  });
  if (!blockResult.ok || !blockResult.data) return blockResult;

  return actions.addExerciseToBlockAction({
    block_id: blockResult.data.id,
    exercise_id: exerciseId,
  });
}

/** Resolves the create-session request against whichever backing action its
 * mode calls for — a blank session, a copy of an existing one, or a copy of
 * a Block Library template. */
async function resolveCreateSession(
  data: SessionCreateData,
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
): Promise<{ ok: boolean; error?: string }> {
  const weekResult = await ensureWeekExists(data.week_number, program, actions);
  if (!weekResult.ok) return weekResult;

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

/** A stand-in session row shown the instant "+ Add session" is submitted, so
 * the new column is on screen while the create round-trips instead of the
 * canvas looking unchanged until the refresh lands (see
 * router-refresh-modal-gap). `useSyncSessionsFromProgram` swaps it for the
 * real row once the refresh arrives; for copy/template modes the real name
 * isn't known client-side, so it shows a placeholder for that ~1s. When the
 * modal was opened by dropping a library exercise on the "+ Add session"
 * zone, `seedExercise` seeds a pending block so that exercise shows (dimmed,
 * with a spinner) right away rather than a beat after the empty column. */
export function optimisticSession(
  data: SessionCreateData,
  program: ProgramWithSessions,
  sessions: SessionWithBlocks[],
  seedExercise?: ExerciseWithDetails,
): SessionWithBlocks {
  const now = new Date().toISOString();
  const siblings = sessions.filter((s) => s.week_number === data.week_number);
  const id = `optimistic-${Date.now()}`;
  return {
    id,
    program_id: program.id,
    week_number: data.week_number,
    name: data.mode === "blank" ? data.name : "New session…",
    position:
      siblings.length === 0
        ? 0
        : Math.max(...siblings.map((s) => s.position)) + 1,
    link_group_id: null,
    created_at: now,
    updated_at: now,
    blocks:
      seedExercise && data.mode === "blank"
        ? [createPendingBlock(id, seedExercise)]
        : [],
  };
}

function useSessionModalHandlers(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  sessionModal: SessionModalState,
  setSessionModal: (state: SessionModalState) => void,
  sessions: SessionWithBlocks[],
  setSessions: Dispatch<SetStateAction<SessionWithBlocks[]>>,
  exercisesById: Map<string, ExerciseWithDetails>,
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

  /** Runs an optimistic session mutation: apply it locally, close the modal,
   * then either let the refresh reconcile or roll back and surface the
   * error. */
  async function optimistically(
    apply: (prev: SessionWithBlocks[]) => SessionWithBlocks[],
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    const rollback = sessions;
    setSessions(apply);
    setSessionModal(null);
    const result = await action();
    if (result.ok) {
      router.refresh();
    } else {
      setSessions(rollback);
      showError(result.error ?? "Something went wrong.");
    }
  }

  async function handleCreateSession(data: SessionCreateData) {
    const seedExerciseId =
      sessionModal?.type === "create" ? sessionModal.seedExerciseId : undefined;
    const seedExercise = seedExerciseId
      ? exercisesById.get(seedExerciseId)
      : undefined;
    const ghost = optimisticSession(data, program, sessions, seedExercise);
    await optimistically(
      (prev) => [...prev, ghost],
      () =>
        data.mode === "blank" && seedExerciseId
          ? createSeededSession(data, seedExerciseId, program, actions)
          : resolveCreateSession(data, program, actions),
    );
  }

  async function handleRenameSession(name: string) {
    if (sessionModal?.type !== "rename") return;
    const id = sessionModal.session.id;
    await optimistically(
      (prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)),
      () => actions.updateSessionNameAction(id, name),
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
    const rollback = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    const result = await actions.deleteSessionAction(id);
    if (result.ok) router.refresh();
    else {
      setSessions(rollback);
      showError(result.error ?? "Something went wrong.");
    }
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
  setWeekSessionOrder: (sessions: SessionWithBlocks[]) => void,
  exercisesById: Map<string, ExerciseWithDetails>,
  blockTemplateNamesById: Map<string, string>,
  sessionTemplatesById: Map<string, SessionTemplateSummary>,
  router: ReturnType<typeof useRouter>,
  onLibraryDropOnNewSession: (exerciseId: string, weekNumber: number) => void,
) {
  const weekBlocks = weekSessions.flatMap((s) => s.blocks);
  const linkAware = useLinkAwareActions(weekBlocks, actions, router);
  const createBlockAction = (sessionId: string, name: string) =>
    actions.createBlockAction({ session_id: sessionId, name });

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
    createBlockFromTemplateAction: actions.createBlockFromTemplateAction,
    createBlocksFromSessionTemplateAction:
      actions.createBlocksFromSessionTemplateAction,
    exercisesById,
  });

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
    weekSessions,
    setWeekSessionOrder,
    reorderSessionsAction: actions.reorderSessionsAction,
    onLibraryDropOnNewSession,
    onExercisePlaced: (be, parentBlock) =>
      isPending(be)
        ? blockActions.openExerciseEditor(be, parentBlock)
        : blockActions.reconcileEditingExercise(be),
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

  return { deleteWeek };
}

/** Keeps the "+ Week" modal on its "Adding…" state after a successful submit
 * until router.refresh() brings the new week(s) into props, then fires
 * `onArrived` with the first new week number. Without this the modal closes on
 * the near side of the server round-trip, briefly showing the old week strip
 * as if nothing was added. `onTimeout` is a safety net so the modal can never
 * get stuck if the count somehow never updates. */
function useWeekAddCompletion(
  currentWeeks: number,
  onArrived: (firstNewWeek: number) => void,
  onTimeout: () => void,
) {
  const [weeksAtSubmit, setWeeksAtSubmit] = useState<number | null>(null);

  useEffect(() => {
    if (weeksAtSubmit === null) return;
    if (currentWeeks > weeksAtSubmit) {
      const firstNewWeek = weeksAtSubmit + 1;
      setWeeksAtSubmit(null);
      onArrived(firstNewWeek);
      return;
    }
    const timer = setTimeout(() => {
      setWeeksAtSubmit(null);
      onTimeout();
    }, 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeeks, weeksAtSubmit]);

  return {
    awaitingWeekAdd: weeksAtSubmit !== null,
    beginAwaitWeekAdd: () => setWeeksAtSubmit(currentWeeks),
  };
}

/** Loads the "import from another program" options — the eligible source
 * programs (once the modal opens) and the full program behind the current
 * selection. `reset` clears both, called when the modal closes. */
function useImportSourceSelection(
  open: boolean,
  programId: string,
  actions: ProgramCanvasActions,
) {
  const [eligibleSources, setEligibleSources] = useState<
    ProgramSummary[] | null
  >(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedSourceProgram, setSelectedSourceProgram] =
    useState<ProgramWithSessions | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      const result = await actions.listEligibleImportSourcesAction(programId);
      if (!cancelled) setEligibleSources(result.ok ? (result.data ?? []) : []);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, programId]);

  useEffect(() => {
    if (!selectedSourceId) {
      setSelectedSourceProgram(null);
      return;
    }
    const id = selectedSourceId;
    let cancelled = false;
    async function load() {
      const r = await actions.getImportSourceProgramAction(id);
      if (!cancelled) setSelectedSourceProgram(r.ok ? (r.data ?? null) : null);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSourceId]);

  function reset() {
    setEligibleSources(null);
    setSelectedSourceId(null);
    setSelectedSourceProgram(null);
  }

  return {
    eligibleSources,
    selectedSourceId,
    setSelectedSourceId,
    selectedSourceProgram,
    reset,
  };
}

/** Backs the "+ Week" modal — either adding N blank weeks or importing
 * another program's weeks. Kept separate from `SessionModalState` since
 * it's week-scoped, not session-scoped. */
function useWeekAddModalState(
  program: ProgramWithSessions,
  actions: ProgramCanvasActions,
  router: ReturnType<typeof useRouter>,
  selectWeek: (week: number) => void,
  showError: (message: string) => void,
) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    eligibleSources,
    selectedSourceId,
    setSelectedSourceId,
    selectedSourceProgram,
    reset: resetImportSources,
  } = useImportSourceSelection(open, program.id, actions);

  function openWeekAddModal() {
    setOpen(true);
  }

  function closeWeekAddModal() {
    setOpen(false);
    resetImportSources();
  }

  // The modal is held open on "Adding…" between a successful submit and the
  // refreshed props landing (see useWeekAddCompletion), so it never looks
  // like nothing happened.
  const { awaitingWeekAdd, beginAwaitWeekAdd } = useWeekAddCompletion(
    program.weeks,
    (firstNewWeek) => {
      setSaving(false);
      closeWeekAddModal();
      selectWeek(firstNewWeek);
    },
    () => {
      setSaving(false);
      closeWeekAddModal();
      router.refresh();
    },
  );

  function finish(result: { ok: boolean; error?: string }) {
    if (result.ok) {
      beginAwaitWeekAdd();
      router.refresh();
    } else {
      showError(result.error ?? "Something went wrong.");
      setSaving(false);
    }
  }

  async function submitAddBlankWeeks(count: number) {
    if (saving) return;
    setSaving(true);
    finish(await actions.addBlankProgramWeeksAction(program.id, count));
  }

  async function submitImportProgramWeeks(weekNumbers: number[]) {
    if (saving || !selectedSourceId) return;
    setSaving(true);
    finish(
      await actions.copyProgramWeeksAction({
        sourceProgramId: selectedSourceId,
        destinationProgramId: program.id,
        sourceWeekNumbers: weekNumbers,
      }),
    );
  }

  async function submitDuplicateWeeks(weekNumbers: number[]) {
    if (saving || weekNumbers.length === 0) return;
    setSaving(true);
    finish(await actions.duplicateProgramWeeksAction(program.id, weekNumbers));
  }

  return {
    weekAddModalOpen: open,
    openWeekAddModal,
    closeWeekAddModal,
    eligibleImportSources: eligibleSources,
    selectedImportSourceId: selectedSourceId,
    selectImportSource: setSelectedSourceId,
    selectedImportSourceProgram: selectedSourceProgram,
    submitAddBlankWeeks,
    submitImportProgramWeeks,
    submitDuplicateWeeks,
    savingWeekAdd: saving || awaitingWeekAdd,
  };
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

/** The dnd/block-action layer works off one flat array spanning every
 * visible session's blocks (see useCanvasBlockState); these push an updated
 * flat array — or a session reorder — back onto the per-session `sessions`
 * state. Recreated each render, same as the inline closures they replaced. */
function makeWeekScopedSetters(
  weekSessions: SessionWithBlocks[],
  setSessions: Dispatch<SetStateAction<SessionWithBlocks[]>>,
) {
  return {
    setWeekBlocks(blocks: BlockWithExercises[]) {
      const weekSessionIds = new Set(weekSessions.map((s) => s.id));
      setSessions((prev) => patchWeekBlocks(prev, weekSessionIds, blocks));
    },
    setWeekSessionOrder(reordered: SessionWithBlocks[]) {
      const positionById = new Map(reordered.map((s, index) => [s.id, index]));
      setSessions((prev) =>
        prev.map((s) =>
          positionById.has(s.id)
            ? { ...s, position: positionById.get(s.id)! }
            : s,
        ),
      );
    },
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
  const libraryPanel = useLibraryPanelState({ idPrefix: "program-canvas" });

  useSyncSessionsFromProgram(program, setSessions);

  const weekSessions = sessions
    .filter((s) => s.week_number === selectedWeek)
    .sort((a, b) => a.position - b.position);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const { blockTemplateNamesById, sessionTemplatesById } =
    buildTemplateLookups(sessionTemplates);

  const { setWeekBlocks, setWeekSessionOrder } = makeWeekScopedSetters(
    weekSessions,
    setSessions,
  );

  const { dnd, blockActions } = useCanvasBlockState(
    weekSessions,
    actions,
    setWeekBlocks,
    setWeekSessionOrder,
    exercisesById,
    blockTemplateNamesById,
    sessionTemplatesById,
    router,
    (exerciseId, weekNumber) =>
      setSessionModal(seededCreateModalState(exerciseId, weekNumber)),
  );

  function selectWeek(week: number) {
    setSelectedWeek(week);
  }

  const { deleteWeek } = useWeekHandlers(
    program,
    actions,
    selectedWeek,
    selectWeek,
    router,
    showError,
  );

  const weekAddModal = useWeekAddModalState(
    program,
    actions,
    router,
    selectWeek,
    showError,
  );

  const sessionModalHandlers = useSessionModalHandlers(
    program,
    actions,
    sessionModal,
    setSessionModal,
    sessions,
    setSessions,
    exercisesById,
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
    libraryPanel,
    ...sessionModalHandlers,
    ...weekAddModal,
  };
}
