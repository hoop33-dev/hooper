"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import type {
  BlockExerciseWithDetails,
  ExerciseStyleRow,
  SessionWithBlocks,
} from "@hooper/db";
import Link from "next/link";
import { BookmarkIcon, DuplicateIcon, LinkIcon, PencilIcon } from "../ui/icons";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { BlockCard, type BlockSettingsPatch } from "./BlockCard";
import { BlockGapDropZone } from "./dnd/BlockGapDropZone";
import { NewBlockDropZone } from "./dnd/NewBlockDropZone";
import {
  blockGapDropId,
  sessionColId,
  sessionDropId,
} from "./dnd/useBlockExerciseDnd";

interface SessionCanvasColumnProps {
  programId: string;
  session: SessionWithBlocks;
  styles: ExerciseStyleRow[];
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate?: () => void;
  onAddBlock: () => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (blockId: string, exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onSaveBlockAsTemplate?: (blockId: string) => void;
  onUpdateBlock: (blockId: string, patch: BlockSettingsPatch) => void;
}

function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
      <circle cx="2" cy="2" r="1.2" />
      <circle cx="2" cy="6" r="1.2" />
      <circle cx="2" cy="10" r="1.2" />
      <circle cx="6" cy="2" r="1.2" />
      <circle cx="6" cy="6" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
    </svg>
  );
}

function ColumnHeaderActions({
  onRename,
  onDuplicate,
  onDelete,
  onSaveAsTemplate,
}: {
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate?: () => void;
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
      {onSaveAsTemplate && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onSaveAsTemplate();
          }}
          className="text-portal-text3 hover:text-portal-orange"
          title="Save as template">
          <BookmarkIcon />
        </button>
      )}
      <InlineConfirmDelete
        onDelete={onDelete}
        idleTitle="Delete"
        idleClassName="text-portal-text3 hover:text-red-500"
      />
    </div>
  );
}

function ColumnHeader({
  programId,
  session,
  onRename,
  onDuplicate,
  onDelete,
  onSaveAsTemplate,
  dragHandleAttributes,
  dragHandleListeners,
}: Pick<
  SessionCanvasColumnProps,
  | "programId"
  | "session"
  | "onRename"
  | "onDuplicate"
  | "onDelete"
  | "onSaveAsTemplate"
> & {
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: Record<string, unknown>;
}) {
  return (
    <div className="border-portal-border bg-portal-card group rounded-lg border p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <button
          type="button"
          className="text-portal-text3 hover:text-portal-text1 mt-0.5 flex-shrink-0 cursor-grab touch-none active:cursor-grabbing"
          title="Drag to reorder"
          {...dragHandleAttributes}
          {...dragHandleListeners}>
          <GripIcon />
        </button>
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
          <div className="text-portal-text3 mt-0.5 flex items-center gap-1 text-[10px]">
            {session.blocks.length} block
            {session.blocks.length === 1 ? "" : "s"}
            {session.link_group_id && (
              <span
                className="text-portal-orange flex-shrink-0"
                title="Linked across weeks — editing it updates every linked week">
                <LinkIcon size={9} />
              </span>
            )}
          </div>
        </Link>
        <ColumnHeaderActions
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      </div>
    </div>
  );
}

export function SessionCanvasColumn(props: SessionCanvasColumnProps) {
  const {
    session,
    styles,
    onAddBlock,
    onOpenExercise,
    onRemoveExercise,
    onRenameBlock,
    onDeleteBlock,
    onSaveBlockAsTemplate,
    onUpdateBlock,
  } = props;
  // Lets a block be dropped into the general column area — the only
  // registered target when a session has no blocks to hover over yet.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: sessionDropId(session.id),
  });
  // Column-level drag-to-reorder — shares the block/exercise DndContext (see
  // handleSessionColumnDrop in useBlockExerciseDnd.ts). No CSS transform is
  // applied: the column stays put while dragging (a DragOverlay ghost card
  // follows the pointer instead) so only the gap's insertion line moves,
  // matching how BlockCard handles block reordering.
  const {
    attributes: dragHandleAttributes,
    listeners: dragHandleListeners,
    setNodeRef: setSortableRef,
    isDragging,
  } = useSortable({ id: sessionColId(session.id) });

  return (
    <div
      ref={setSortableRef}
      className={cn(
        "flex w-[220px] flex-shrink-0 flex-col gap-2",
        isDragging && "opacity-40",
      )}>
      <ColumnHeader
        {...props}
        dragHandleAttributes={dragHandleAttributes}
        dragHandleListeners={dragHandleListeners}
      />
      <div
        ref={setDroppableRef}
        className={cn(
          "flex flex-1 flex-col rounded-lg",
          isOver && "bg-portal-orange-soft",
        )}>
        <BlockGapDropZone
          id={blockGapDropId(session.id, 0)}
          afterBlockId={session.blocks[0]?.id ?? null}
          dense
        />
        {session.blocks.map((block, i) => (
          <div key={block.id} className="contents">
            <BlockCard
              block={block}
              styles={styles}
              dense
              onOpenExercise={onOpenExercise}
              onRemoveExercise={(exerciseRowId) =>
                onRemoveExercise(block.id, exerciseRowId)
              }
              onRename={(name) => onRenameBlock(block.id, name)}
              onDelete={() => onDeleteBlock(block.id)}
              onSaveAsTemplate={
                onSaveBlockAsTemplate
                  ? () => onSaveBlockAsTemplate(block.id)
                  : undefined
              }
              onUpdateBlock={(patch) => onUpdateBlock(block.id, patch)}
            />
            <BlockGapDropZone
              id={blockGapDropId(session.id, i + 1)}
              beforeBlockId={block.id}
              afterBlockId={session.blocks[i + 1]?.id ?? null}
              dense
            />
          </div>
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
