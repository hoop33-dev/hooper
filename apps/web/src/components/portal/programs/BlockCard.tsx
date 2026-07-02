"use client";

import { cn } from "@/src/lib/cn";
import type { Active, Over } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { AddExercisePopover } from "./AddExercisePopover";
import { SortableBlockExerciseRow } from "./dnd/SortableBlockExerciseRow";
import { isInsertAfter } from "./dnd/insertPosition";

/** Dragging a whole block is always allowed (including across sessions on
 * the canvas) — readOnly only gates rename/delete/add-exercise actions. */
function computeBlockDropIndicator(
  blockDomId: string,
  hasExercises: boolean,
  active: Active | null,
  over: Over | null,
) {
  const isBlockDrag =
    typeof active?.id === "string" && active.id.startsWith("block:");
  const isDropTarget =
    isBlockDrag && over?.id === blockDomId && active?.id !== blockDomId;
  // Rows handle their own insertion line; an empty block has no row to
  // anchor one to, so give it a plain highlight instead when an exercise
  // is dragged over it (never for block drags — those get the line above).
  const isEmptyExerciseDropTarget =
    !isBlockDrag && active != null && over?.id === blockDomId && !hasExercises;
  return {
    isDropTarget,
    after: isDropTarget && isInsertAfter(active, over),
    isEmptyExerciseDropTarget,
  };
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.3" />
      <circle cx="2.5" cy="7" r="1.3" />
      <circle cx="2.5" cy="11.5" r="1.3" />
      <circle cx="7.5" cy="2.5" r="1.3" />
      <circle cx="7.5" cy="7" r="1.3" />
      <circle cx="7.5" cy="11.5" r="1.3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function BlockNameField({
  name,
  color,
  readOnly,
  onRename,
}: {
  name: string;
  color: string;
  readOnly?: boolean;
  onRename: (name: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    setRenaming(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraft(name);
  }

  if (renaming) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onClick={(e) => e.stopPropagation()}
        className="border-portal-orange bg-portal-card text-portal-text1 min-w-0 flex-1 rounded border px-1.5 py-0.5 text-[13px] font-bold outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => !readOnly && setRenaming(true)}
      title={readOnly ? undefined : "Click to rename"}
      style={{ color }}
      className={cn(
        "-mx-1 min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-[13px] font-bold",
        !readOnly && "hover:bg-portal-border/50",
      )}>
      {name}
    </button>
  );
}

interface BlockCardHeaderProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onRename: (name: string) => void;
  onDelete: () => void;
  addExercise?: {
    exercises: ExerciseWithDetails[];
    onAdd: (id: string) => void;
  };
}

function BlockCardHeader({
  block,
  readOnly,
  dragHandleProps,
  onRename,
  onDelete,
  addExercise,
}: BlockCardHeaderProps) {
  return (
    <div className="border-portal-border bg-portal-bg flex items-center gap-2 border-b px-3 py-2">
      <button
        type="button"
        className="text-portal-text3 flex-shrink-0 cursor-grab touch-none"
        {...dragHandleProps}>
        <GripIcon />
      </button>
      <BlockNameField
        name={block.name}
        color={block.color}
        readOnly={readOnly}
        onRename={onRename}
      />
      {!readOnly && addExercise && (
        <AddExercisePopover
          exercises={addExercise.exercises}
          onAdd={addExercise.onAdd}
        />
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={onDelete}
          className="text-portal-text3 flex-shrink-0 hover:text-red-500">
          <XIcon />
        </button>
      )}
    </div>
  );
}

interface BlockCardBodyProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  dense?: boolean;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (id: string) => void;
}

function BlockCardBody({
  block,
  readOnly,
  dense,
  onOpenExercise,
  onRemoveExercise,
}: BlockCardBodyProps) {
  return (
    <SortableContext
      items={block.exercises.map((e) => `block-exercise:${e.id}`)}
      strategy={verticalListSortingStrategy}>
      {block.exercises.length === 0 ? (
        <div className="text-portal-text3 px-4 py-5 text-center text-[11px] italic">
          {readOnly ? "No exercises yet" : "Drag an exercise here"}
        </div>
      ) : (
        block.exercises.map((be) => (
          <SortableBlockExerciseRow
            key={be.id}
            blockExercise={be}
            readOnly={readOnly}
            dense={dense}
            onOpen={() => onOpenExercise(be)}
            onRemove={() => onRemoveExercise(be.id)}
          />
        ))
      )}
    </SortableContext>
  );
}

interface BlockCardProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  dense?: boolean;
  exercises?: ExerciseWithDetails[];
  onAddExercise?: (exerciseId: string) => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (id: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function BlockCard({
  block,
  readOnly,
  dense,
  exercises,
  onAddExercise,
  onOpenExercise,
  onRemoveExercise,
  onRename,
  onDelete,
}: BlockCardProps) {
  const blockDomId = `block:${block.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
    over,
  } = useSortable({ id: blockDomId });
  const { isDropTarget, after, isEmptyExerciseDropTarget } =
    computeBlockDropIndicator(
      blockDomId,
      block.exercises.length > 0,
      active,
      over,
    );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-portal-card border-portal-border relative overflow-hidden rounded-xl border",
        isEmptyExerciseDropTarget && "bg-portal-orange-soft",
        isDragging && "opacity-40",
      )}>
      {isDropTarget && (
        <div
          className={cn(
            "bg-portal-orange absolute inset-x-0 z-10 h-0.5",
            after ? "bottom-0" : "top-0",
          )}
        />
      )}
      <BlockCardHeader
        block={block}
        readOnly={readOnly}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRename={onRename}
        onDelete={onDelete}
        addExercise={
          !dense && exercises && onAddExercise
            ? { exercises, onAdd: onAddExercise }
            : undefined
        }
      />
      <BlockCardBody
        block={block}
        readOnly={readOnly}
        dense={dense}
        onOpenExercise={onOpenExercise}
        onRemoveExercise={onRemoveExercise}
      />
    </div>
  );
}
