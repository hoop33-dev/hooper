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
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { ProgramLibraryShelf } from "./ProgramLibraryShelf";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { SessionCanvasRow } from "./SessionCanvasRow";
import { SessionModals } from "./SessionModals";
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
  sessionTemplates,
  state,
  onSaveBlockAsTemplate,
  saveSessionAsTemplateEnabled,
  createExerciseActions,
}: {
  program: ProgramWithSessions;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  styles: ExerciseStyleRow[];
  sessionTemplates: SessionTemplateSummary[];
  state: CanvasState;
  onSaveBlockAsTemplate: ((blockId: string) => void) | undefined;
  saveSessionAsTemplateEnabled: boolean;
  createExerciseActions: CreateExerciseActions;
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
        sessionTemplates={sessionTemplates}
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
          saving={state.savingWeekAdd}
          onClose={state.closeWeekAddModal}
          onSubmitBlank={state.submitAddBlankWeeks}
          onSubmitImport={state.submitImportProgramWeeks}
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
            sessionTemplates={sessionTemplates}
            state={state}
            onSaveBlockAsTemplate={onSaveBlockAsTemplate}
            saveSessionAsTemplateEnabled={!!actions.saveSessionAsTemplateAction}
            createExerciseActions={createExerciseActions}
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
