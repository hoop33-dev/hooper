import type { LinkScope, MeasurementInput } from "@/src/services/block.service";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseStyleRow,
  ExerciseWithDetails,
  SessionRow,
  SessionTemplateSummary,
} from "@hooper/db";
import {
  BlockExerciseMeasurementModal,
  type BlockExerciseUpdateData,
} from "./BlockExerciseMeasurementModal";
import { SaveAsTemplatePopover } from "./SaveAsTemplatePopover";
import {
  SessionCreateModal,
  type SessionCreateData,
} from "./SessionCreateModal";
import { SessionDuplicateModal } from "./SessionDuplicateModal";
import { SessionRenamePopover } from "./SessionRenamePopover";
import { SupersetRoundsModal } from "./SupersetRoundsModal";
import type { SessionModalState } from "./useProgramCanvasState";
import { variantOptionsFor } from "./variantOptions";

interface SessionModalsProps {
  sessionModal: SessionModalState;
  onCloseSessionModal: () => void;
  existingSessions: SessionRow[];
  sessionTemplates?: SessionTemplateSummary[];
  totalWeeks: number;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  /** The duplicate modal's session's current linked weeks (its own week
   * only, if it isn't linked to anything). */
  linkedWeeks: number[];
  /** Set when the create modal was opened by dropping a library exercise on
   * the "+ Add session" zone — shows what's being seeded into the new
   * session's first block and locks the modal to a plain named session. */
  seedExerciseName?: string;
  onCreateSession: (data: SessionCreateData) => Promise<void>;
  onRenameSession: (name: string) => Promise<void>;
  onDuplicateSession: (targetWeeks: number[]) => Promise<void>;
  onSaveSessionAsTemplate: (name: string) => Promise<void>;
  editingExercise: BlockExerciseWithDetails | null;
  /** Every week the exercise being edited is linked across, when it's more
   * than just itself — enables the measurement modal's scope choice. */
  editingExerciseLinkedWeeks?: number[];
  onCloseExerciseEditor: () => void;
  onSaveExerciseMeasurement: (
    data: BlockExerciseUpdateData,
    scope?: LinkScope,
  ) => Promise<void>;
  editingSupersetBlock: BlockWithExercises | null;
  onCloseSupersetEditor: () => void;
  onSaveSupersetMeasurements: (
    perExercise: { id: string; measurements: MeasurementInput[] }[],
  ) => Promise<void>;
}

export function SessionModals({
  sessionModal,
  onCloseSessionModal,
  existingSessions,
  sessionTemplates,
  totalWeeks,
  exercises,
  styles,
  linkedWeeks,
  seedExerciseName,
  onCreateSession,
  onRenameSession,
  onDuplicateSession,
  onSaveSessionAsTemplate,
  editingExercise,
  editingExerciseLinkedWeeks,
  onCloseExerciseEditor,
  onSaveExerciseMeasurement,
  editingSupersetBlock,
  onCloseSupersetEditor,
  onSaveSupersetMeasurements,
}: SessionModalsProps) {
  return (
    <>
      {sessionModal?.type === "create" && (
        <SessionCreateModal
          weekNumber={sessionModal.weekNumber}
          existingSessions={existingSessions}
          sessionTemplates={sessionTemplates}
          seedExerciseName={seedExerciseName}
          onClose={onCloseSessionModal}
          onCreate={onCreateSession}
        />
      )}
      {sessionModal?.type === "rename" && (
        <SessionRenamePopover
          currentName={sessionModal.session.name}
          onClose={onCloseSessionModal}
          onRename={onRenameSession}
        />
      )}
      {sessionModal?.type === "duplicate" && (
        <SessionDuplicateModal
          sessionName={sessionModal.session.name}
          sourceWeek={sessionModal.session.week_number}
          totalWeeks={totalWeeks}
          linkedWeeks={linkedWeeks}
          onClose={onCloseSessionModal}
          onDuplicate={onDuplicateSession}
        />
      )}
      {sessionModal?.type === "saveAsTemplate" && (
        <SaveAsTemplatePopover
          title="Save session as template"
          defaultName={sessionModal.session.name}
          onClose={onCloseSessionModal}
          onSave={onSaveSessionAsTemplate}
        />
      )}
      {editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={editingExercise}
          linkedWeeks={editingExerciseLinkedWeeks}
          onClose={onCloseExerciseEditor}
          onSave={onSaveExerciseMeasurement}
          variantOptions={variantOptionsFor(
            editingExercise.exercise,
            exercises,
          )}
          styles={styles}
        />
      )}
      {editingSupersetBlock && (
        <SupersetRoundsModal
          block={editingSupersetBlock}
          onClose={onCloseSupersetEditor}
          onSave={onSaveSupersetMeasurements}
        />
      )}
    </>
  );
}
