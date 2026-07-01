"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockExerciseWithDetails, BlockWithExercises } from "@hooper/db";
import { useState } from "react";
import { BlockColorPicker } from "./BlockColorPicker";
import { SortableBlockExerciseRow } from "./dnd/SortableBlockExerciseRow";

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
  readOnly,
  onRename,
}: {
  name: string;
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
      className="text-portal-text1 min-w-0 flex-1 truncate text-left text-[13px] font-bold">
      {name}
    </button>
  );
}

interface BlockCardHeaderProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  sortableBlock?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

function BlockCardHeader({
  block,
  readOnly,
  sortableBlock,
  dragHandleProps,
  onRename,
  onColorChange,
  onDelete,
}: BlockCardHeaderProps) {
  return (
    <div className="border-portal-border bg-portal-bg flex items-center gap-2 border-b px-3 py-2">
      {sortableBlock && !readOnly && (
        <button
          type="button"
          className="text-portal-text3 flex-shrink-0 cursor-grab touch-none"
          {...dragHandleProps}>
          <GripIcon />
        </button>
      )}
      <BlockNameField
        name={block.name}
        readOnly={readOnly}
        onRename={onRename}
      />
      {!readOnly && (
        <>
          <BlockColorPicker color={block.color} onChange={onColorChange} />
          <button
            type="button"
            onClick={onDelete}
            className="text-portal-text3 flex-shrink-0 hover:text-red-500">
            <XIcon />
          </button>
        </>
      )}
    </div>
  );
}

interface BlockCardProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  sortableBlock?: boolean;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (id: string) => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

export function BlockCard({
  block,
  readOnly,
  sortableBlock,
  onOpenExercise,
  onRemoveExercise,
  onRename,
  onColorChange,
  onDelete,
}: BlockCardProps) {
  const sortable = useSortable({
    id: `block:${block.id}`,
    disabled: !sortableBlock,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `block:${block.id}`,
    disabled: readOnly,
  });

  function setRefs(el: HTMLDivElement | null) {
    sortable.setNodeRef(el);
    setDropRef(el);
  }

  return (
    <div
      ref={setRefs}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        borderLeftColor: block.color,
      }}
      className={cn(
        "border-portal-border bg-portal-card overflow-hidden rounded-xl border border-l-[3px]",
        isOver && !readOnly && "ring-portal-orange ring-2",
        sortable.isDragging && "opacity-40",
      )}>
      <BlockCardHeader
        block={block}
        readOnly={readOnly}
        sortableBlock={sortableBlock}
        dragHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
        onRename={onRename}
        onColorChange={onColorChange}
        onDelete={onDelete}
      />
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
              onOpen={() => onOpenExercise(be)}
              onRemove={() => onRemoveExercise(be.id)}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}
