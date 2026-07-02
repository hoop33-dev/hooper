"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  SessionWithBlocks,
} from "@hooper/db";
import { BlockExerciseMeasurementModal } from "./BlockExerciseMeasurementModal";
import { BlockList } from "./BlockList";
import { blockDndCollision } from "./dnd/collision";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
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
        collisionDetection={blockDndCollision}
        onDragStart={state.dnd.handleDragStart}
        onDragMove={state.dnd.handleDragMove}
        onDragEnd={state.dnd.handleDragEnd}
        onDragCancel={state.dnd.handleDragCancel}>
        <DragIndicatorContext.Provider value={state.dnd.indicator}>
          <ExerciseLibraryPanel exercises={exercises} categories={categories} />
          {/* Column wrapper gives the block list a definite, bounded height
              so it scrolls vertically instead of overflowing the page. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
            />
          </div>
          <DragOverlay>
            <DragPreviewOverlay
              activeId={state.dnd.activeId}
              blocks={state.blocks}
              exercisesById={state.exercisesById}
            />
          </DragOverlay>
        </DragIndicatorContext.Provider>
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
