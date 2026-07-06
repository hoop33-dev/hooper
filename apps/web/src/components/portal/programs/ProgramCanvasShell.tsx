"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  ProgramWithSessions,
  SessionTemplateSummary,
} from "@hooper/db";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import { ProgramLibraryShelf } from "./ProgramLibraryShelf";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { SessionCanvasRow } from "./SessionCanvasRow";
import { SessionModals } from "./SessionModals";
import {
  useProgramCanvasState,
  type ProgramCanvasActions,
} from "./useProgramCanvasState";
import { WeekTabStrip } from "./WeekTabStrip";

interface ProgramCanvasShellProps extends ProgramCanvasActions {
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
  sessionTemplates,
  state,
  onSaveBlockAsTemplate,
  saveSessionAsTemplateEnabled,
}: {
  program: ProgramWithSessions;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates: SessionTemplateSummary[];
  state: CanvasState;
  onSaveBlockAsTemplate: ((blockId: string) => void) | undefined;
  saveSessionAsTemplateEnabled: boolean;
}) {
  return (
    <>
      <WeekTabStrip
        totalWeeks={program.weeks}
        selectedWeek={state.selectedWeek}
        onSelect={state.selectWeek}
        onAddWeek={state.addWeek}
      />
      <SessionCanvasRow
        programId={program.id}
        sessions={state.weekSessions}
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
      />
      <ProgramLibraryShelf
        exercises={exercises}
        categories={categories}
        sessionTemplates={sessionTemplates}
      />
      <DragOverlay dropAnimation={state.dnd.dropAnimation}>
        <DragPreviewOverlay
          activeId={state.dnd.activeId}
          blocks={state.weekSessions.flatMap((s) => s.blocks)}
          exercisesById={state.exercisesById}
          blockTemplateNamesById={state.blockTemplateNamesById}
          sessionTemplatesById={state.sessionTemplatesById}
        />
      </DragOverlay>
    </>
  );
}

function ProgramCanvasModals({
  state,
  totalWeeks,
}: {
  state: CanvasState;
  totalWeeks: number;
}) {
  return (
    <>
      <SessionModals
        sessionModal={state.sessionModal}
        onCloseSessionModal={() => state.setSessionModal(null)}
        existingSessions={state.sessions}
        sessionTemplates={state.sessionTemplates}
        totalWeeks={totalWeeks}
        linkedWeeks={state.linkedWeeksForSessionModal}
        onCreateSession={state.handleCreateSession}
        onRenameSession={state.handleRenameSession}
        onDuplicateSession={state.handleDuplicateSession}
        onSaveSessionAsTemplate={state.handleSaveSessionAsTemplate}
        editingExercise={state.blockActions.editingExercise}
        editingExerciseLinkedWeeks={state.linkedWeeksForEditingExercise}
        onCloseExerciseEditor={state.blockActions.closeExerciseEditor}
        onSaveExerciseMeasurement={state.blockActions.saveExerciseMeasurement}
      />
      {state.blockActions.savingAsTemplateBlock && (
        <SaveAsTemplatePopover
          title="Save block as template"
          defaultName={state.blockActions.savingAsTemplateBlock.name}
          onClose={state.blockActions.closeSaveBlockAsTemplate}
          onSave={state.blockActions.submitSaveBlockAsTemplate}
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
  ...actions
}: ProgramCanvasShellProps) {
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
            sessionTemplates={sessionTemplates}
            state={state}
            onSaveBlockAsTemplate={onSaveBlockAsTemplate}
            saveSessionAsTemplateEnabled={!!actions.saveSessionAsTemplateAction}
          />
        </DragIndicatorContext.Provider>
      </DndContext>

      <ProgramCanvasModals state={state} totalWeeks={program.weeks} />
    </div>
  );
}
