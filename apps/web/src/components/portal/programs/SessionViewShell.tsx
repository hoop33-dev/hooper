"use client";

import {
  isExercisePlacement,
  isSequencePlacement,
} from "@/src/lib/sequenceDisplay";
import type { SequenceInput } from "@/src/services/sequence.service";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseWithDetails,
  LibrarySequenceWithDetails,
  SessionTemplateSummary,
  SessionWithBlocks,
  UnitTypeRow,
} from "@hooper/db";
import { BlockSequenceModal } from "../sequences/BlockSequenceModal";
import {
  SequenceSupportProvider,
  sequenceSupportFor,
  useSequenceSupport,
} from "../sequences/SequenceSupportContext";
import { useToast } from "../ui/Toast";
import { BlockExerciseMeasurementModal } from "./BlockExerciseMeasurementModal";
import { BlockList } from "./BlockList";
import { libraryTemplates, type LibraryTemplate } from "./blockTemplateFilter";
import { DragIndicatorContext } from "./dnd/DragIndicatorContext";
import { DragPreviewOverlay } from "./dnd/DragPreviewOverlay";
import { keepGhostUnderCursor } from "./dnd/keepGhostUnderCursor";
import type { CreateExerciseActions } from "./exerciseActionsProps";
import { filterExercises } from "./exerciseFilter";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import { filterSequences } from "./SequenceLibraryPanels";
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
  /** Library sequences for the sidebar; omit to hide sequences entirely. */
  sequences?: LibrarySequenceWithDetails[];
  createSequenceAction?: (
    input: SequenceInput,
  ) => Promise<{ ok: boolean; error?: string; id?: string }>;
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
  const sequenceSupport = useSequenceSupport();
  return (
    <>
      {state.blockActions.editingExercise &&
        isSequencePlacement(state.blockActions.editingExercise) &&
        sequenceSupport && (
          <BlockSequenceModal
            key={state.blockActions.editingExercise.id}
            blockExercise={state.blockActions.editingExercise}
            lockedSets={state.blockActions.editingSequenceRounds}
            linkedWeeks={state.editingExerciseLinkedWeeks}
            support={sequenceSupport}
            onClose={state.blockActions.closeExerciseEditor}
            onSave={state.blockActions.saveSequence}
          />
        )}
      {state.blockActions.editingExercise &&
        isExercisePlacement(state.blockActions.editingExercise) && (
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
  filteredSequences: LibrarySequenceWithDetails[] | undefined,
  showError: (message: string) => void,
) {
  function onAddBlock() {
    state.blockActions.addBlock(sessionId, "New block");
  }

  function onAddSelected() {
    if (state.libraryPanel.tab === "sequences") {
      const sequence =
        filteredSequences?.[state.libraryPanel.selectedIndex ?? 0];
      if (!sequence || !state.blockActions.addSequenceToBlock) {
        showError("No sequences match your search.");
        return;
      }
      const lastBlock = state.blocks[state.blocks.length - 1];
      if (!lastBlock) {
        showError("Add a block to this session first.");
        return;
      }
      void state.blockActions.addSequenceToBlock(lastBlock.id, sequence.id);
      return;
    }
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
  sequences: LibrarySequenceWithDetails[] | undefined,
) {
  const { showError } = useToast();
  const filteredSequences = sequences
    ? filterSequences(sequences, state.libraryPanel.sequenceSearch)
    : undefined;
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
    filteredSequences,
    showError,
  );

  useLibraryShortcuts({
    isModalOpen: isSessionModalOpen(state),
    onFocusExercises: state.libraryPanel.focusExercises,
    onFocusBlocks: state.libraryPanel.focusBlocks,
    onAddBlock,
    onAddSelected,
  });

  return {
    filteredExercises,
    filteredBlockTemplates,
    filteredSequences,
    onAddSelected,
  };
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
  filteredSequences,
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
  filteredSequences?: LibrarySequenceWithDetails[];
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
            filteredSequences={filteredSequences}
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
              onAddSequenceToBlock={state.blockActions.addSequenceToBlock}
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
          <DragOverlay
            dropAnimation={state.dnd.dropAnimation}
            modifiers={[keepGhostUnderCursor]}>
            <DragPreviewOverlay
              activeId={state.dnd.activeId}
              blocks={state.blocks}
              exercisesById={state.exercisesById}
              blockTemplateNamesById={state.blockTemplateNamesById}
              sessionTemplatesById={state.sessionTemplatesById}
              sequencesById={state.sequencesById}
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
  replaceExercisePhotosAction,
  createCategoryAction,
  createStyleAction,
  createUnitTypeAction,
  sequences,
  createSequenceAction,
  ...actions
}: SessionViewShellProps) {
  // Sequences only show where the page can actually place them.
  const sequenceList = actions.addSequenceToBlockAction ? sequences : undefined;
  const state = useSessionViewState(
    session,
    exercises,
    actions,
    sessionTemplates,
    sequenceList,
  );

  const {
    filteredExercises,
    filteredBlockTemplates,
    filteredSequences,
    onAddSelected,
  } = useSessionLibraryShortcuts(
    session.id,
    state,
    exercises,
    categories,
    sessionTemplates,
    sequenceList,
  );

  const createExerciseActions: CreateExerciseActions = {
    profileId,
    createExerciseAction,
    updateExerciseAction,
    updateExerciseVideoUrlAction,
    replaceExercisePhotosAction,
    createCategoryAction,
    styles,
    createStyleAction,
    unitTypes,
    createUnitTypeAction,
  };

  return (
    <SequenceSupportProvider
      value={sequenceSupportFor(
        sequenceList,
        exercises,
        categories,
        unitTypes,
        createSequenceAction,
      )}>
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
          filteredSequences={filteredSequences}
          onQuickAdd={onAddSelected}
          saveBlockAsTemplateAction={actions.saveBlockAsTemplateAction}
          createExerciseActions={createExerciseActions}
        />
      </div>
    </SequenceSupportProvider>
  );
}
