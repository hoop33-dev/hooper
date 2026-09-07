"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseWithDetails,
  SessionTemplateSummary,
  SessionWithBlocks,
  UnitTypeRow,
} from "@hooper/db";
import { useToast } from "../ui/Toast";
import { BlockExerciseMeasurementModal } from "./BlockExerciseMeasurementModal";
import { BlockList } from "./BlockList";
import { libraryTemplates, type LibraryTemplate } from "./blockTemplateFilter";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { filterExercises } from "./exerciseFilter";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { SessionLibrarySidebar } from "./SessionLibrarySidebar";
import { SupersetRoundsModal } from "./SupersetRoundsModal";
import { useLibraryShortcuts } from "./useLibraryShortcuts";
import {
  useSessionViewState,
  type SessionViewActions,
} from "./useSessionViewState";
import { variantOptionsFor } from "./variantOptions";

interface SessionViewShellProps
  extends SessionViewActions, CreateExerciseActions {
  session: SessionWithBlocks;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  sessionTemplates?: SessionTemplateSummary[];
}

type SessionViewState = ReturnType<typeof useSessionViewState>;

function SessionViewModals({
  state,
  exercises,
  styles,
  unitTypes,
  createUnitTypeAction,
  profileId,
}: {
  state: SessionViewState;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  createUnitTypeAction?: CreateExerciseActions["createUnitTypeAction"];
  profileId: string;
}) {
  return (
    <>
      {state.blockActions.editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={state.blockActions.editingExercise}
          linkedWeeks={state.editingExerciseLinkedWeeks}
          onClose={state.blockActions.closeExerciseEditor}
          onSave={state.blockActions.saveExerciseMeasurement}
          variantOptions={variantOptionsFor(
            state.blockActions.editingExercise.exercise,
            exercises,
          )}
          styles={styles}
          unitTypes={unitTypes}
          createUnitTypeAction={createUnitTypeAction}
          profileId={profileId}
        />
      )}

      {state.blockActions.editingSupersetBlock && (
        <SupersetRoundsModal
          block={state.blockActions.editingSupersetBlock}
          exercises={exercises}
          styles={styles}
          unitTypes={unitTypes}
          createUnitTypeAction={createUnitTypeAction}
          profileId={profileId}
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

/** Whether any modal is currently open on the session editor — the keyboard
 * shortcuts go inert while one is, so they don't fight a modal's own
 * inputs/focus. */
function isSessionModalOpen(state: SessionViewState): boolean {
  return (
    state.blockActions.editingExercise !== null ||
    state.blockActions.editingSupersetBlock !== null ||
    state.blockActions.savingAsTemplateBlock !== null
  );
}

/** Shift+W/Shift+A act on this page's single session (and, for Shift+A, its
 * last block) — split out of the Shell component so it stays under the
 * lint's max-lines-per-function limit. Not a hook itself (no React hooks
 * called), just a plain closure factory. */
function createQuickAddHandlers(
  sessionId: string,
  state: SessionViewState,
  filteredExercises: ExerciseWithDetails[],
  filteredBlockTemplates: LibraryTemplate[],
  showError: (message: string) => void,
) {
  function onAddBlock() {
    state.blockActions.addBlock(sessionId, "New block");
  }

  function onAddSelected() {
    if (state.libraryPanel.tab === "exercises") {
      const exercise = filteredExercises[state.libraryPanel.selectedIndex ?? 0];
      if (!exercise) {
        showError("No exercises match your search.");
        return;
      }
      const lastBlock = state.blocks[state.blocks.length - 1];
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
    state.blockActions.addBlockFromTemplate(sessionId, template.dragId);
  }

  return { onAddBlock, onAddSelected };
}

/** Computes the filtered library lists and wires up the Shift+F/B/W/A
 * shortcuts — split out of the Shell component so it stays under the lint's
 * max-lines-per-function limit. */
function useSessionLibraryShortcuts(
  sessionId: string,
  state: SessionViewState,
  exercises: ExerciseWithDetails[],
  categories: ExerciseCategoryRow[],
  sessionTemplates: SessionTemplateSummary[],
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
    sessionId,
    state,
    filteredExercises,
    filteredBlockTemplates,
    showError,
  );

  useLibraryShortcuts({
    isModalOpen: isSessionModalOpen(state),
    onFocusExercises: state.libraryPanel.focusExercises,
    onFocusBlocks: state.libraryPanel.focusBlocks,
    onAddBlock,
    onAddSelected,
  });

  return { filteredExercises, filteredBlockTemplates, onAddSelected };
}

/** The DndContext + library sidebar + block list + modals — split out of
 * SessionViewShell so it stays under the lint's max-lines-per-function
 * limit (mirrors ProgramCanvasBody in ProgramCanvasShell.tsx). */
function SessionViewBody({
  session,
  exercises,
  categories,
  styles,
  unitTypes,
  state,
  filteredExercises,
  filteredBlockTemplates,
  onQuickAdd,
  saveBlockAsTemplateAction,
  createExerciseActions,
}: {
  session: SessionWithBlocks;
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  state: SessionViewState;
  filteredExercises: ExerciseWithDetails[];
  filteredBlockTemplates: LibraryTemplate[];
  onQuickAdd: () => void;
  saveBlockAsTemplateAction: SessionViewActions["saveBlockAsTemplateAction"];
  createExerciseActions: CreateExerciseActions;
}) {
  return (
    <>
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
            libraryPanel={state.libraryPanel}
            filteredExercises={filteredExercises}
            filteredBlockTemplates={filteredBlockTemplates}
            onQuickAdd={onQuickAdd}
            {...createExerciseActions}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <BlockList
              sessionId={session.id}
              blocks={state.blocks}
              exercises={exercises}
              styles={styles}
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
                saveBlockAsTemplateAction
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

      <SessionViewModals
        state={state}
        exercises={exercises}
        styles={styles}
        unitTypes={unitTypes}
        createUnitTypeAction={createExerciseActions.createUnitTypeAction}
        profileId={createExerciseActions.profileId}
      />
    </>
  );
}

export function SessionViewShell({
  session,
  exercises,
  categories,
  styles,
  unitTypes,
  sessionTemplates = [],
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  createCategoryAction,
  createStyleAction,
  createUnitTypeAction,
  ...actions
}: SessionViewShellProps) {
  const state = useSessionViewState(
    session,
    exercises,
    actions,
    sessionTemplates,
  );

  const { filteredExercises, filteredBlockTemplates, onAddSelected } =
    useSessionLibraryShortcuts(
      session.id,
      state,
      exercises,
      categories,
      sessionTemplates,
    );

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

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <SessionViewBody
        session={session}
        exercises={exercises}
        categories={categories}
        styles={styles}
        unitTypes={unitTypes}
        state={state}
        filteredExercises={filteredExercises}
        filteredBlockTemplates={filteredBlockTemplates}
        onQuickAdd={onAddSelected}
        saveBlockAsTemplateAction={actions.saveBlockAsTemplateAction}
        createExerciseActions={createExerciseActions}
      />
    </div>
  );
}
