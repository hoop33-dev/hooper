"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseWithDetails,
  ProgramWithSessions,
  SessionTemplateSummary,
  UnitTypeRow,
} from "@hooper/db";
import { useToast } from "../ui/Toast";
import { libraryTemplates, type LibraryTemplate } from "./blockTemplateFilter";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { filterExercises } from "./exerciseFilter";
import { useProgramHeaderCollapse } from "./ProgramHeaderCollapseContext";
import { ProgramLibraryShelf } from "./ProgramLibraryShelf";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { SessionCanvasRow } from "./SessionCanvasRow";
import { SessionModals } from "./SessionModals";
import { useLibraryShortcuts } from "./useLibraryShortcuts";
import {
  useProgramCanvasState,
  type ProgramCanvasActions,
} from "./useProgramCanvasState";
import { WeekAddModal } from "./WeekAddModal";
import { WeekTabStrip } from "./WeekTabStrip";

interface ProgramCanvasShellProps
  extends ProgramCanvasActions, CreateExerciseActions {
  program: ProgramWithSessions;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates?: SessionTemplateSummary[];
}

type CanvasState = ReturnType<typeof useProgramCanvasState>;

/** Only offered once the page has wired up a real save action — a block or
 * session opened outside a program context (e.g. the template editor
 * itself) never passes these. */
function saveBlockAsTemplateHandler(state: CanvasState, enabled: boolean) {
  if (!enabled) return undefined;
  return (blockId: string) =>
    state.blockActions.openSaveBlockAsTemplate(
      state.weekSessions
        .flatMap((s) => s.blocks)
        .find((b) => b.id === blockId) ?? null,
    );
}

function ProgramCanvasBody({
  program,
  exercises,
  categories,
  styles,
  state,
  onSaveBlockAsTemplate,
  saveSessionAsTemplateEnabled,
  createExerciseActions,
  filteredExercises,
  filteredBlockTemplates,
  onQuickAdd,
  headerCollapsed,
  onToggleHeaderCollapsed,
}: {
  program: ProgramWithSessions;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  styles: ExerciseStyleRow[];
  state: CanvasState;
  onSaveBlockAsTemplate: ((blockId: string) => void) | undefined;
  saveSessionAsTemplateEnabled: boolean;
  createExerciseActions: CreateExerciseActions;
  filteredExercises: ExerciseWithDetails[];
  filteredBlockTemplates: LibraryTemplate[];
  onQuickAdd: () => void;
  headerCollapsed: boolean;
  onToggleHeaderCollapsed: () => void;
}) {
  return (
    <>
      <WeekTabStrip
        totalWeeks={program.weeks}
        selectedWeek={state.selectedWeek}
        onSelect={state.selectWeek}
        onOpenAddWeek={state.openWeekAddModal}
        onDeleteWeek={state.deleteWeek}
        updatedAt={program.updated_at}
        updatedByName={program.updatedByName}
        headerCollapsed={headerCollapsed}
        onToggleHeaderCollapsed={onToggleHeaderCollapsed}
      />
      <SessionCanvasRow
        programId={program.id}
        weekNumber={state.selectedWeek}
        sessions={state.weekSessions}
        styles={styles}
        onRenameSession={(session) =>
          state.setSessionModal({ type: "rename", session })
        }
        onDuplicateSession={(session) =>
          state.setSessionModal({ type: "duplicate", session })
        }
        onDeleteSession={state.handleDeleteSession}
        onSaveSessionAsTemplate={
          saveSessionAsTemplateEnabled
            ? (session) =>
                state.setSessionModal({ type: "saveAsTemplate", session })
            : undefined
        }
        onAddSession={() =>
          state.setSessionModal({
            type: "create",
            weekNumber: state.selectedWeek,
          })
        }
        onAddBlock={(sessionId) =>
          state.blockActions.addBlock(sessionId, "New block")
        }
        onOpenExercise={state.blockActions.openExerciseEditor}
        onRemoveExercise={(_blockId, exerciseRowId) =>
          state.blockActions.removeExerciseById(exerciseRowId)
        }
        onRenameBlock={state.blockActions.renameBlock}
        onDeleteBlock={state.blockActions.deleteBlockById}
        onSaveBlockAsTemplate={onSaveBlockAsTemplate}
        onUpdateBlock={state.blockActions.updateBlockSettings}
      />
      <ProgramLibraryShelf
        exercises={exercises}
        categories={categories}
        libraryPanel={state.libraryPanel}
        filteredExercises={filteredExercises}
        filteredBlockTemplates={filteredBlockTemplates}
        onQuickAdd={onQuickAdd}
        {...createExerciseActions}
      />
      <DragOverlay dropAnimation={state.dnd.dropAnimation}>
        <DragPreviewOverlay
          activeId={state.dnd.activeId}
          blocks={state.weekSessions.flatMap((s) => s.blocks)}
          exercisesById={state.exercisesById}
          blockTemplateNamesById={state.blockTemplateNamesById}
          sessionTemplatesById={state.sessionTemplatesById}
          sessions={state.weekSessions}
        />
      </DragOverlay>
    </>
  );
}

/** Last session in the currently-viewed week — the shared target for the
 * Shift+W/Shift+A "quick add" shortcuts (see createQuickAddHandlers). */
function lastWeekSession(state: CanvasState) {
  return state.weekSessions[state.weekSessions.length - 1];
}

/** Shift+W/Shift+A act on the last session (and, for Shift+A, its last
 * block) in the currently-viewed week — split out of the Shell component so
 * it stays under the lint's max-lines-per-function limit. Not a hook itself
 * (no React hooks called), just a plain closure factory. */
function createQuickAddHandlers(
  state: CanvasState,
  filteredExercises: ExerciseWithDetails[],
  filteredBlockTemplates: LibraryTemplate[],
  showError: (message: string) => void,
) {
  function onAddBlock() {
    const lastSession = lastWeekSession(state);
    if (!lastSession) {
      showError("Add a session to this week first.");
      return;
    }
    state.blockActions.addBlock(lastSession.id, "New block");
  }

  function onAddSelected() {
    const lastSession = lastWeekSession(state);
    if (!lastSession) {
      showError("Add a session to this week first.");
      return;
    }
    if (state.libraryPanel.tab === "exercises") {
      const exercise = filteredExercises[state.libraryPanel.selectedIndex ?? 0];
      if (!exercise) {
        showError("No exercises match your search.");
        return;
      }
      const lastBlock = lastSession.blocks[lastSession.blocks.length - 1];
      if (!lastBlock) {
        showError("Add a block to this session first.");
        return;
      }
      state.blockActions.addExerciseToBlock(lastBlock.id, exercise.id);
      return;
    }
    const template =
      filteredBlockTemplates[state.libraryPanel.selectedIndex ?? 0];
    if (!template) {
      showError("No block templates match your search.");
      return;
    }
    state.blockActions.addBlockFromTemplate(lastSession.id, template.dragId);
  }

  return { onAddBlock, onAddSelected };
}

/** Whether any modal is currently open on the program canvas — the keyboard
 * shortcuts go inert while one is, so they don't fight a modal's own
 * inputs/focus. */
function isProgramModalOpen(state: CanvasState): boolean {
  return (
    state.sessionModal !== null ||
    state.blockActions.editingExercise !== null ||
    state.blockActions.editingSupersetBlock !== null ||
    state.blockActions.savingAsTemplateBlock !== null ||
    state.weekAddModalOpen
  );
}

/** Computes the filtered library lists and wires up the Shift+F/B/Q/W/A
 * shortcuts — split out of the Shell component so it stays under the lint's
 * max-lines-per-function limit. */
function useProgramLibraryShortcuts(
  state: CanvasState,
  exercises: ExerciseWithDetails[],
  categories: ExerciseCategoryRow[],
  sessionTemplates: SessionTemplateSummary[],
  headerCollapsed: boolean,
  setHeaderCollapsed: (value: boolean) => void,
) {
  const { showError } = useToast();
  const baseExercises = exercises.filter((ex) => !ex.parent_id);
  const filteredExercises = filterExercises(
    baseExercises,
    state.libraryPanel.exerciseSearch,
    state.libraryPanel.exerciseCategoryId,
    categories,
  );
  const filteredBlockTemplates = libraryTemplates(
    sessionTemplates,
    state.libraryPanel.blockSearch,
  );
  const { onAddBlock, onAddSelected } = createQuickAddHandlers(
    state,
    filteredExercises,
    filteredBlockTemplates,
    showError,
  );

  useLibraryShortcuts({
    isModalOpen: isProgramModalOpen(state),
    onFocusExercises: state.libraryPanel.focusExercises,
    onFocusBlocks: state.libraryPanel.focusBlocks,
    onAddSession: () =>
      state.setSessionModal({ type: "create", weekNumber: state.selectedWeek }),
    onAddBlock,
    onAddSelected,
    // Shift+E drives the header band and library panel as one. When both
    // agree it just flips them; when they disagree it collapses both first
    // (so the next press is guaranteed to expand both), rather than toggling
    // each independently and never reaching a clean shared state.
    onToggleCollapseAll: () => {
      const anyExpanded = state.libraryPanel.open || !headerCollapsed;
      state.libraryPanel.setOpen(!anyExpanded);
      setHeaderCollapsed(anyExpanded);
    },
  });

  return { filteredExercises, filteredBlockTemplates, onAddSelected };
}

function ProgramCanvasModals({
  state,
  totalWeeks,
  exercises,
  styles,
  unitTypes,
  createUnitTypeAction,
  profileId,
}: {
  state: CanvasState;
  totalWeeks: number;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  createUnitTypeAction?: CreateExerciseActions["createUnitTypeAction"];
  profileId: string;
}) {
  const seedExerciseName =
    state.sessionModal?.type === "create" && state.sessionModal.seedExerciseId
      ? state.exercisesById.get(state.sessionModal.seedExerciseId)?.name
      : undefined;

  return (
    <>
      <SessionModals
        sessionModal={state.sessionModal}
        onCloseSessionModal={() => state.setSessionModal(null)}
        existingSessions={state.sessions}
        sessionTemplates={state.sessionTemplates}
        totalWeeks={totalWeeks}
        exercises={exercises}
        styles={styles}
        unitTypes={unitTypes}
        createUnitTypeAction={createUnitTypeAction}
        profileId={profileId}
        linkedWeeks={state.linkedWeeksForSessionModal}
        seedExerciseName={seedExerciseName}
        onCreateSession={state.handleCreateSession}
        onRenameSession={state.handleRenameSession}
        onDuplicateSession={state.handleDuplicateSession}
        onSaveSessionAsTemplate={state.handleSaveSessionAsTemplate}
        editingExercise={state.blockActions.editingExercise}
        editingExerciseLinkedWeeks={state.linkedWeeksForEditingExercise}
        onCloseExerciseEditor={state.blockActions.closeExerciseEditor}
        onSaveExerciseMeasurement={state.blockActions.saveExerciseMeasurement}
        editingSupersetBlock={state.blockActions.editingSupersetBlock}
        onCloseSupersetEditor={state.blockActions.closeSupersetEditor}
        onSaveSupersetMeasurements={state.blockActions.saveSupersetMeasurements}
      />
      {state.blockActions.savingAsTemplateBlock && (
        <SaveAsTemplatePopover
          title="Save block as template"
          defaultName={state.blockActions.savingAsTemplateBlock.name}
          onClose={state.blockActions.closeSaveBlockAsTemplate}
          onSave={state.blockActions.submitSaveBlockAsTemplate}
        />
      )}
      {state.weekAddModalOpen && (
        <WeekAddModal
          eligibleSources={state.eligibleImportSources}
          selectedSourceId={state.selectedImportSourceId}
          onSelectSource={state.selectImportSource}
          selectedSourceProgram={state.selectedImportSourceProgram}
          currentProgram={{ weeks: totalWeeks, sessions: state.sessions }}
          defaultDuplicateWeek={state.selectedWeek}
          saving={state.savingWeekAdd}
          onClose={state.closeWeekAddModal}
          onSubmitBlank={state.submitAddBlankWeeks}
          onSubmitImport={state.submitImportProgramWeeks}
          onSubmitDuplicate={state.submitDuplicateWeeks}
        />
      )}
    </>
  );
}

export function ProgramCanvasShell({
  program,
  exercises,
  categories,
  sessionTemplates = [],
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
  styles,
  createStyleAction,
  unitTypes,
  createUnitTypeAction,
  ...actions
}: ProgramCanvasShellProps) {
  const createExerciseActions: CreateExerciseActions = {
    profileId,
    createExerciseAction,
    updateExerciseAction,
    updateExerciseVideoUrlAction,
    createCategoryAction,
    styles,
    createStyleAction,
    unitTypes,
    createUnitTypeAction,
  };
  const state = useProgramCanvasState(
    program,
    exercises,
    actions,
    sessionTemplates,
  );
  const onSaveBlockAsTemplate = saveBlockAsTemplateHandler(
    state,
    !!actions.saveBlockAsTemplateAction,
  );
  const { headerCollapsed, setHeaderCollapsed, toggleHeaderCollapsed } =
    useProgramHeaderCollapse();

  const { filteredExercises, filteredBlockTemplates, onAddSelected } =
    useProgramLibraryShortcuts(
      state,
      exercises,
      categories,
      sessionTemplates,
      headerCollapsed,
      setHeaderCollapsed,
    );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DndContext
        sensors={state.dnd.sensors}
        collisionDetection={state.dnd.collisionDetection}
        onDragStart={state.dnd.handleDragStart}
        onDragMove={state.dnd.handleDragMove}
        onDragEnd={state.dnd.handleDragEnd}
        onDragCancel={state.dnd.handleDragCancel}>
        <DragIndicatorContext.Provider value={state.dnd.indicator}>
          <ProgramCanvasBody
            program={program}
            exercises={exercises}
            categories={categories}
            styles={styles}
            state={state}
            onSaveBlockAsTemplate={onSaveBlockAsTemplate}
            saveSessionAsTemplateEnabled={!!actions.saveSessionAsTemplateAction}
            createExerciseActions={createExerciseActions}
            filteredExercises={filteredExercises}
            filteredBlockTemplates={filteredBlockTemplates}
            onQuickAdd={onAddSelected}
            headerCollapsed={headerCollapsed}
            onToggleHeaderCollapsed={toggleHeaderCollapsed}
          />
        </DragIndicatorContext.Provider>
      </DndContext>

      <ProgramCanvasModals
        state={state}
        totalWeeks={program.weeks}
        exercises={exercises}
        styles={styles}
        unitTypes={unitTypes}
        createUnitTypeAction={createUnitTypeAction}
        profileId={profileId}
      />
    </div>
  );
}
