"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseWithDetails,
  ProgramWithSessions,
} from "@hooper/db";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import { ExerciseLibraryShelf } from "./ExerciseLibraryShelf";
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
}

export function ProgramCanvasShell({
  program,
  exercises,
  categories,
  ...actions
}: ProgramCanvasShellProps) {
  const state = useProgramCanvasState(program, exercises, actions);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DndContext
        sensors={state.dnd.sensors}
        onDragStart={state.dnd.handleDragStart}
        onDragEnd={state.dnd.handleDragEnd}
        onDragCancel={state.dnd.handleDragCancel}>
        <WeekTabStrip
          totalWeeks={program.weeks}
          selectedWeek={state.selectedWeek}
          onSelect={state.selectWeek}
        />
        <SessionCanvasRow
          programId={program.id}
          sessions={state.weekSessions}
          focusedSessionId={state.focusedSessionId}
          onFocus={state.setFocusedSessionId}
          onRenameSession={(session) =>
            state.setSessionModal({ type: "rename", session })
          }
          onDuplicateSession={(session) =>
            state.setSessionModal({ type: "duplicate", session })
          }
          onDeleteSession={state.handleDeleteSession}
          onAddSession={() =>
            state.setSessionModal({
              type: "create",
              weekNumber: state.selectedWeek,
            })
          }
          onAddBlock={() => state.blockActions.addBlock("New block")}
          onOpenExercise={state.blockActions.openExerciseEditor}
          onRemoveExercise={(_blockId, exerciseRowId) =>
            state.blockActions.removeExerciseById(exerciseRowId)
          }
          onRenameBlock={state.blockActions.renameBlock}
          onColorChangeBlock={state.blockActions.changeBlockColor}
          onDeleteBlock={state.blockActions.deleteBlockById}
        />
        <ExerciseLibraryShelf exercises={exercises} categories={categories} />
        <DragOverlay>
          <DragPreviewOverlay
            activeId={state.dnd.activeId}
            blocks={state.focusedSession?.blocks ?? []}
            exercisesById={state.exercisesById}
          />
        </DragOverlay>
      </DndContext>

      <SessionModals
        sessionModal={state.sessionModal}
        onCloseSessionModal={() => state.setSessionModal(null)}
        existingSessions={state.sessions}
        totalWeeks={program.weeks}
        onCreateSession={state.handleCreateSession}
        onRenameSession={state.handleRenameSession}
        onDuplicateSession={state.handleDuplicateSession}
        editingExercise={state.blockActions.editingExercise}
        onCloseExerciseEditor={state.blockActions.closeExerciseEditor}
        onSaveExerciseMeasurement={state.blockActions.saveExerciseMeasurement}
      />
    </div>
  );
}
