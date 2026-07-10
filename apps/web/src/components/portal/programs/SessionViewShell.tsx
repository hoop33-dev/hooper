"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  SessionTemplateSummary,
  SessionWithBlocks,
} from "@hooper/db";
import { BlockExerciseMeasurementModal } from "./BlockExerciseMeasurementModal";
import { BlockList } from "./BlockList";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { SessionLibrarySidebar } from "./SessionLibrarySidebar";
import { SupersetRoundsModal } from "./SupersetRoundsModal";
import {
  useSessionViewState,
  type SessionViewActions,
} from "./useSessionViewState";

interface SessionViewShellProps
  extends SessionViewActions, CreateExerciseActions {
  session: SessionWithBlocks;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates?: SessionTemplateSummary[];
}

type SessionViewState = ReturnType<typeof useSessionViewState>;

function SessionViewModals({ state }: { state: SessionViewState }) {
  return (
    <>
      {state.blockActions.editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={state.blockActions.editingExercise}
          linkedWeeks={state.editingExerciseLinkedWeeks}
          onClose={state.blockActions.closeExerciseEditor}
          onSave={state.blockActions.saveExerciseMeasurement}
        />
      )}

      {state.blockActions.editingSupersetBlock && (
        <SupersetRoundsModal
          block={state.blockActions.editingSupersetBlock}
          onClose={state.blockActions.closeSupersetEditor}
          onSave={state.blockActions.saveSupersetMeasurements}
        />
      )}

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

export function SessionViewShell({
  session,
  exercises,
  categories,
  sessionTemplates = [],
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  ...actions
}: SessionViewShellProps) {
  const state = useSessionViewState(
    session,
    exercises,
    actions,
    sessionTemplates,
  );

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <DndContext
        sensors={state.dnd.sensors}
        collisionDetection={state.dnd.collisionDetection}
        onDragStart={state.dnd.handleDragStart}
        onDragMove={state.dnd.handleDragMove}
        onDragEnd={state.dnd.handleDragEnd}
        onDragCancel={state.dnd.handleDragCancel}>
        <DragIndicatorContext.Provider value={state.dnd.indicator}>
          <SessionLibrarySidebar
            exercises={exercises}
            categories={categories}
            sessionTemplates={sessionTemplates}
            profileId={profileId}
            createExerciseAction={createExerciseAction}
            updateExerciseAction={updateExerciseAction}
            updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <BlockList
              sessionId={session.id}
              blocks={state.blocks}
              exercises={exercises}
              onOpenExercise={state.blockActions.openExerciseEditor}
              onRemoveExercise={state.blockActions.removeExerciseById}
              onRenameBlock={state.blockActions.renameBlock}
              onDeleteBlock={state.blockActions.deleteBlockById}
              onAddBlock={(name) =>
                state.blockActions.addBlock(session.id, name)
              }
              onAddExerciseToBlock={state.blockActions.addExerciseToBlock}
              onUpdateBlock={state.blockActions.updateBlockSettings}
              onSaveBlockAsTemplate={
                actions.saveBlockAsTemplateAction
                  ? (blockId) =>
                      state.blockActions.openSaveBlockAsTemplate(
                        state.blocks.find((b) => b.id === blockId) ?? null,
                      )
                  : undefined
              }
            />
          </div>
          <DragOverlay dropAnimation={state.dnd.dropAnimation}>
            <DragPreviewOverlay
              activeId={state.dnd.activeId}
              blocks={state.blocks}
              exercisesById={state.exercisesById}
              blockTemplateNamesById={state.blockTemplateNamesById}
              sessionTemplatesById={state.sessionTemplatesById}
            />
          </DragOverlay>
        </DragIndicatorContext.Provider>
      </DndContext>

      <SessionViewModals state={state} />
    </div>
  );
}
