"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  SessionWithBlocks,
} from "@hooper/db";
import { BlockExerciseMeasurementModal } from "./BlockExerciseMeasurementModal";
import { BlockList } from "./BlockList";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import { ExerciseLibraryPanel } from "./ExerciseLibraryPanel";
import {
  useSessionViewState,
  type SessionViewActions,
} from "./useSessionViewState";

interface SessionViewShellProps extends SessionViewActions {
  session: SessionWithBlocks;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
}

export function SessionViewShell({
  session,
  exercises,
  categories,
  ...actions
}: SessionViewShellProps) {
  const state = useSessionViewState(session, exercises, actions);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <DndContext
        sensors={state.dnd.sensors}
        onDragStart={state.dnd.handleDragStart}
        onDragEnd={state.dnd.handleDragEnd}
        onDragCancel={state.dnd.handleDragCancel}>
        <ExerciseLibraryPanel exercises={exercises} categories={categories} />
        <BlockList
          sessionId={session.id}
          blocks={state.blocks}
          exercises={exercises}
          onOpenExercise={state.blockActions.openExerciseEditor}
          onRemoveExercise={state.blockActions.removeExerciseById}
          onRenameBlock={state.blockActions.renameBlock}
          onDeleteBlock={state.blockActions.deleteBlockById}
          onAddBlock={(name) => state.blockActions.addBlock(session.id, name)}
          onAddExerciseToBlock={state.blockActions.addExerciseToBlock}
        />
        <DragOverlay>
          <DragPreviewOverlay
            activeId={state.dnd.activeId}
            blocks={state.blocks}
            exercisesById={state.exercisesById}
          />
        </DragOverlay>
      </DndContext>

      {state.blockActions.editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={state.blockActions.editingExercise}
          onClose={state.blockActions.closeExerciseEditor}
          onSave={state.blockActions.saveExerciseMeasurement}
        />
      )}
    </div>
  );
}
