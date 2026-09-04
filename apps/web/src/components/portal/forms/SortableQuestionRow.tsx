"use client";

import { cn } from "@/src/lib/cn";
import { useSortable } from "@dnd-kit/sortable";
import type { FormQuestionWithOptions } from "@hooper/db";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { PortalBadge } from "../ui/PortalBadge";
import { questionTypeLabel } from "./questionTypes";

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

interface SortableQuestionRowProps {
  question: FormQuestionWithOptions;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  isDropTarget: boolean;
  dropAfter: boolean;
  dragActive: boolean;
}

export function SortableQuestionRow({
  question,
  index,
  onOpen,
  onDelete,
  isDropTarget,
  dropAfter,
  dragActive,
}: SortableQuestionRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: question.id,
  });

  // No CSS transform is applied: items stay put while dragging so only the
  // insertion line moves, matching the program editor's block/exercise rows.
  // Hover is suppressed for every row during a drag — otherwise the plain
  // CSS :hover on whatever row the pointer physically passes over would
  // light up alongside (or instead of) the insertion line.
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-portal-border bg-portal-card group relative flex cursor-pointer touch-none items-center gap-3 rounded-xl border px-4 py-3.5 select-none",
        !dragActive && "hover:bg-portal-bg",
        isDragging && "opacity-40",
      )}
      onClick={onOpen}
      {...attributes}
      {...listeners}>
      {isDropTarget && (
        <div
          className={cn(
            "bg-portal-orange pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full",
            dropAfter ? "-bottom-1.5" : "-top-1.5",
          )}
        />
      )}
      <span className="text-portal-text3 flex-shrink-0 cursor-grab active:cursor-grabbing">
        <GripIcon />
      </span>
      <span className="text-portal-text3 w-5 flex-shrink-0 text-xs font-semibold">
        {index + 1}
      </span>
      <span className="text-portal-text1 flex-1 truncate text-sm font-semibold">
        {question.prompt}
      </span>
      <PortalBadge variant="neutral">
        {questionTypeLabel(question.type)}
      </PortalBadge>
      {question.required && (
        <PortalBadge variant="orange">Required</PortalBadge>
      )}
      <InlineConfirmDelete
        onDelete={onDelete}
        idleTitle="Delete question"
        idleClassName="text-portal-text3 hover:text-red-500"
      />
    </div>
  );
}
