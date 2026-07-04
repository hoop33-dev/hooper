"use client";

import { cn } from "@/src/lib/cn";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { SpinnerIcon, XIcon } from "../ui/icons";
import { AddExercisePopover } from "./AddExercisePopover";
import {
  useDragIndicator,
  type DragIndicator,
} from "./dnd/DragIndicatorContext";
import { SortableBlockExerciseRow } from "./dnd/SortableBlockExerciseRow";
import { isPending } from "./dnd/pendingRows";

type BlockDropVisual = {
  lineEdge: "top" | "bottom" | null;
  headerLineEdge: "bottom" | null;
  emptyHighlight: boolean;
};

/**
 * A block card shows either a block-reorder line (block drag hovering this
 * card), a header-bottom line for an exercise/library drop on the block
 * header (it goes first in the block), or a fill highlight (something dropped
 * onto an empty block, which has no row to anchor a line to).
 */
function computeBlockDropVisual(
  blockDomId: string,
  hasExercises: boolean,
  indicator: DragIndicator,
): BlockDropVisual {
  const activeId = indicator.activeId ?? "";
  if (!activeId || indicator.overId !== blockDomId)
    return { lineEdge: null, headerLineEdge: null, emptyHighlight: false };

  if (activeId.startsWith("block:")) {
    if (activeId === blockDomId)
      return { lineEdge: null, headerLineEdge: null, emptyHighlight: false };
    return {
      lineEdge: indicator.after ? "bottom" : "top",
      headerLineEdge: null,
      emptyHighlight: false,
    };
  }
  // Exercise or library item dropped onto the block itself (its header) —
  // show the cue on the header bottom so it reads as "insert first".
  return {
    lineEdge: null,
    headerLineEdge: hasExercises ? "bottom" : null,
    emptyHighlight: !hasExercises,
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
        onPointerDown={(e) => e.stopPropagation()}
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
  pending?: boolean;
  dragHandleProps?: Record<string, unknown>;
  dropLineEdge?: "bottom" | null;
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
  pending,
  dragHandleProps,
  dropLineEdge,
  onRename,
  onDelete,
  addExercise,
}: BlockCardHeaderProps) {
  // The whole header is the block's grab area (a click on the name still
  // renames — the pointer sensor only starts a drag past an 8px threshold).
  return (
    <div
      className="border-portal-border bg-portal-bg relative flex touch-none items-center gap-2 border-b px-3 py-2"
      {...dragHandleProps}>
      {dropLineEdge && (
        <div className="bg-portal-orange pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5" />
      )}
      <span className="text-portal-text3 flex-shrink-0 cursor-grab active:cursor-grabbing">
        {pending ? <SpinnerIcon size={11} /> : <GripIcon />}
      </span>
      <BlockNameField
        name={block.name}
        color={block.color}
        readOnly={readOnly || pending}
        onRename={onRename}
      />
      {!readOnly && !pending && addExercise && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <AddExercisePopover
            exercises={addExercise.exercises}
            onAdd={addExercise.onAdd}
          />
        </div>
      )}
      {!readOnly && !pending && (
        <button
          type="button"
          onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-portal-text3 flex-shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-red-500">
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
  const pending = isPending(block);
  const blockDomId = `block:${block.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: blockDomId,
    disabled: pending,
  });
  const { lineEdge, headerLineEdge, emptyHighlight } = computeBlockDropVisual(
    blockDomId,
    block.exercises.length > 0,
    useDragIndicator(),
  );

  // No CSS transform is applied: blocks stay put while dragging so only the
  // insertion line moves, keeping drop targets stable.
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-portal-card border-portal-border group relative overflow-hidden rounded-xl border",
        emptyHighlight && "bg-portal-orange-soft",
        isDragging && "opacity-40",
        pending && "opacity-60",
      )}>
      {lineEdge && (
        <div
          className={cn(
            "bg-portal-orange pointer-events-none absolute inset-x-0 z-10 h-0.5",
            lineEdge === "bottom" ? "bottom-0" : "top-0",
          )}
        />
      )}
      <BlockCardHeader
        block={block}
        readOnly={readOnly}
        pending={pending}
        dragHandleProps={{ ...attributes, ...listeners }}
        dropLineEdge={headerLineEdge}
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
