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
  onCreateSession: (data: SessionCreateData) => Promise<void>;
  onRenameSession: (name: string) => Promise<void>;
  onDuplicateSession: (targetWeeks: number[]) => Promise<void>;
  editingExercise: BlockExerciseWithDetails | null;
  onCloseExerciseEditor: () => void;
  onSaveExerciseMeasurement: (data: BlockExerciseUpdateData) => Promise<void>;
}

export function SessionModals({
  sessionModal,
  onCloseSessionModal,
  existingSessions,
  totalWeeks,
  onCreateSession,
  onRenameSession,
  onDuplicateSession,
  editingExercise,
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
          onClose={onCloseSessionModal}
          onDuplicate={onDuplicateSession}
        />
      )}
      {editingExercise && (
        <BlockExerciseMeasurementModal
          blockExercise={editingExercise}
          onClose={onCloseExerciseEditor}
          onSave={onSaveExerciseMeasurement}
        />
      )}
    </>
  );
}
