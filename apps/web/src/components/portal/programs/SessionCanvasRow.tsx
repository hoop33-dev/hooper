"use client";

import type { BlockExerciseWithDetails, SessionWithBlocks } from "@hooper/db";
import { SessionCanvasColumn } from "./SessionCanvasColumn";

interface SessionCanvasRowProps {
  programId: string;
  sessions: SessionWithBlocks[];
  onRenameSession: (session: SessionWithBlocks) => void;
  onDuplicateSession: (session: SessionWithBlocks) => void;
  onDeleteSession: (id: string) => void;
  onSaveSessionAsTemplate?: (session: SessionWithBlocks) => void;
  onAddSession: () => void;
  onAddBlock: (sessionId: string) => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (blockId: string, exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onSaveBlockAsTemplate?: (blockId: string) => void;
}

export function SessionCanvasRow({
  programId,
  sessions,
  onRenameSession,
  onDuplicateSession,
  onDeleteSession,
  onSaveSessionAsTemplate,
  onAddSession,
  onAddBlock,
  onOpenExercise,
  onRemoveExercise,
  onRenameBlock,
  onDeleteBlock,
  onSaveBlockAsTemplate,
}: SessionCanvasRowProps) {
  return (
    <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-auto p-4">
      {sessions.map((session) => (
        <SessionCanvasColumn
          key={session.id}
          programId={programId}
          session={session}
          onRename={() => onRenameSession(session)}
          onDuplicate={() => onDuplicateSession(session)}
          onDelete={() => onDeleteSession(session.id)}
          onSaveAsTemplate={
            onSaveSessionAsTemplate
              ? () => onSaveSessionAsTemplate(session)
              : undefined
          }
          onAddBlock={() => onAddBlock(session.id)}
          onOpenExercise={onOpenExercise}
          onRemoveExercise={onRemoveExercise}
          onRenameBlock={onRenameBlock}
          onDeleteBlock={onDeleteBlock}
          onSaveBlockAsTemplate={onSaveBlockAsTemplate}
        />
      ))}
      <div className="w-[100px] flex-shrink-0">
        <button
          type="button"
          onClick={onAddSession}
          className="border-portal-border-mid text-portal-text3 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs font-semibold">
          <span className="text-lg leading-none">+</span>
          Add session
        </button>
      </div>
    </div>
  );
}
