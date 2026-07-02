"use client";

import type { BlockExerciseWithDetails, SessionWithBlocks } from "@hooper/db";
import { SessionCanvasColumn } from "./SessionCanvasColumn";

interface SessionCanvasRowProps {
  programId: string;
  sessions: SessionWithBlocks[];
  focusedSessionId: string | null;
  onFocus: (id: string) => void;
  onRenameSession: (session: SessionWithBlocks) => void;
  onDuplicateSession: (session: SessionWithBlocks) => void;
  onDeleteSession: (id: string) => void;
  onAddSession: () => void;
  onAddBlock: (sessionId: string) => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (blockId: string, exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

export function SessionCanvasRow({
  programId,
  sessions,
  focusedSessionId,
  onFocus,
  onRenameSession,
  onDuplicateSession,
  onDeleteSession,
  onAddSession,
  onAddBlock,
  onOpenExercise,
  onRemoveExercise,
  onRenameBlock,
  onDeleteBlock,
}: SessionCanvasRowProps) {
  return (
    <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-auto p-4">
      {sessions.map((session) => (
        <SessionCanvasColumn
          key={session.id}
          programId={programId}
          session={session}
          isFocused={session.id === focusedSessionId}
          onFocus={() => onFocus(session.id)}
          onRename={() => onRenameSession(session)}
          onDuplicate={() => onDuplicateSession(session)}
          onDelete={() => onDeleteSession(session.id)}
          onAddBlock={() => onAddBlock(session.id)}
          onOpenExercise={onOpenExercise}
          onRemoveExercise={onRemoveExercise}
          onRenameBlock={onRenameBlock}
          onDeleteBlock={onDeleteBlock}
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
