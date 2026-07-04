import type { LinkScope } from "@/src/services/block.service";
import type { BlockExerciseWithDetails, SessionRow } from "@hooper/db";
import {
  BlockExerciseMeasurementModal,
  type BlockExerciseUpdateData,
} from "./BlockExerciseMeasurementModal";
import {
  SessionCreateModal,
  type SessionCreateData,
} from "./SessionCreateModal";
import { SessionDuplicateModal } from "./SessionDuplicateModal";
import { SessionRenamePopover } from "./SessionRenamePopover";
import type { SessionModalState } from "./useProgramCanvasState";

interface SessionModalsProps {
  sessionModal: SessionModalState;
  onCloseSessionModal: () => void;
  existingSessions: SessionRow[];
  totalWeeks: number;
  /** The duplicate modal's session's current linked weeks (its own week
   * only, if it isn't linked to anything). */
  linkedWeeks: number[];
  onCreateSession: (data: SessionCreateData) => Promise<void>;
  onRenameSession: (name: string) => Promise<void>;
  onDuplicateSession: (targetWeeks: number[]) => Promise<void>;
  editingExercise: BlockExerciseWithDetails | null;
  /** Every week the exercise being edited is linked across, when it's more
   * than just itself — enables the measurement modal's scope choice. */
  editingExerciseLinkedWeeks?: number[];
  onCloseExerciseEditor: () => void;
  onSaveExerciseMeasurement: (
    data: BlockExerciseUpdateData,
    scope?: LinkScope,
  ) => Promise<void>;
}

export function SessionModals({
  sessionModal,
  onCloseSessionModal,
  existingSessions,
  totalWeeks,
  linkedWeeks,
  onCreateSession,
  onRenameSession,
  onDuplicateSession,
  editingExercise,
  editingExerciseLinkedWeeks,
  onCloseExerciseEditor,
  onSaveExerciseMeasurement,
}: SessionModalsProps) {
  return (
    <>
      {sessionModal?.type === "create" && (
        <SessionCreateModal
          weekNumber={sessionModal.weekNumber}
          existingSessions={existingSessions}
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
      {editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={editingExercise}
          linkedWeeks={editingExerciseLinkedWeeks}
          onClose={onCloseExerciseEditor}
          onSave={onSaveExerciseMeasurement}
        />
      )}
    </>
  );
}
