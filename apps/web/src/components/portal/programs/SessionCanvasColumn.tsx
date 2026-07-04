"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import type { BlockExerciseWithDetails, SessionWithBlocks } from "@hooper/db";
import Link from "next/link";
import { DuplicateIcon, PencilIcon, XIcon } from "../ui/icons";
import { BlockCard } from "./BlockCard";
import { NewBlockDropZone } from "./dnd/NewBlockDropZone";
import { sessionDropId } from "./dnd/useBlockExerciseDnd";

interface SessionCanvasColumnProps {
  programId: string;
  session: SessionWithBlocks;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBlock: () => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (blockId: string, exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

function ColumnHeaderActions({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onRename();
        }}
        className="text-portal-text3 hover:text-portal-text1"
        title="Rename">
        <PencilIcon />
      </button>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onDuplicate();
        }}
        className="text-portal-text3 hover:text-portal-text1"
        title="Duplicate">
        <DuplicateIcon />
      </button>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onDelete();
        }}
        className="text-portal-text3 hover:text-red-500"
        title="Delete">
        <XIcon />
      </button>
    </div>
  );
}

function ColumnHeader({
  programId,
  session,
  onRename,
  onDuplicate,
  onDelete,
}: Pick<
  SessionCanvasColumnProps,
  "programId" | "session" | "onRename" | "onDuplicate" | "onDelete"
>) {
  return (
    <div className="border-portal-border bg-portal-card group rounded-lg border p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <Link
          href={`/programs/${programId}/sessions/${session.id}`}
          onClick={stop}
          className="min-w-0 flex-1">
          <div className="text-portal-text3 text-[10px] font-bold tracking-wide uppercase">
            Session {session.position + 1}
          </div>
          <div className="text-portal-text1 truncate text-[13px] font-bold hover:underline">
            {session.name}
          </div>
          <div className="text-portal-text3 mt-0.5 text-[10px]">
            {session.blocks.length} block
            {session.blocks.length === 1 ? "" : "s"}
          </div>
        </Link>
        <ColumnHeaderActions
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export function SessionCanvasColumn(props: SessionCanvasColumnProps) {
  const {
    session,
    onAddBlock,
    onOpenExercise,
    onRemoveExercise,
    onRenameBlock,
    onDeleteBlock,
  } = props;
  // Lets a block be dropped into the general column area — the only
  // registered target when a session has no blocks to hover over yet.
  const { setNodeRef, isOver } = useDroppable({
    id: sessionDropId(session.id),
  });

  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col gap-2">
      <ColumnHeader {...props} />
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-lg",
          isOver && "bg-portal-orange-soft",
        )}>
        {session.blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            dense
            onOpenExercise={onOpenExercise}
            onRemoveExercise={(exerciseRowId) =>
              onRemoveExercise(block.id, exerciseRowId)
            }
            onRename={(name) => onRenameBlock(block.id, name)}
            onDelete={() => onDeleteBlock(block.id)}
          />
        ))}
        <NewBlockDropZone
          sessionId={session.id}
          className="border-portal-border-mid rounded-lg border border-dashed">
          <button
            type="button"
            onClick={onAddBlock}
            className="text-portal-text3 w-full py-2 text-xs font-semibold">
            + Add block
          </button>
        </NewBlockDropZone>
      </div>
    </div>
  );
}
