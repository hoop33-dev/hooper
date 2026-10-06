"use client";

import { cn } from "@/src/lib/cn";
import { useSortable } from "@dnd-kit/sortable";
import type { FormQuestionWithOptions } from "@hooper/db";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
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

function Chip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap",
        active
          ? "bg-portal-orange-soft text-portal-orange border-[rgba(241,88,37,0.22)]"
          : "border-portal-border bg-portal-bg text-portal-text2",
      )}>
      {label}
    </span>
  );
}

interface SortableQuestionRowProps {
  question: FormQuestionWithOptions;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onToggleRequired: () => void;
  isDropTarget: boolean;
  dropAfter: boolean;
  dragActive: boolean;
}

export function SortableQuestionRow({
  question,
  index,
  onOpen,
  onDelete,
  onToggleRequired,
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
        "border-portal-border bg-portal-card relative flex cursor-pointer touch-none items-center gap-3 border-b px-4 py-2.5 select-none last:border-b-0",
        !dragActive && "hover:bg-portal-bg",
        isDragging && "opacity-40",
      )}
      onClick={onOpen}
      {...attributes}
      {...listeners}>
      {isDropTarget && (
        <div
          className={cn(
            "bg-portal-orange pointer-events-none absolute inset-x-0 z-10 h-0.5",
            dropAfter ? "-bottom-px" : "-top-px",
          )}
        />
      )}
      <span className="text-portal-text3 flex-shrink-0 cursor-grab active:cursor-grabbing">
        <GripIcon />
      </span>
      <span className="bg-portal-bg font-title text-portal-text2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base font-extrabold">
        {index + 1}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px] font-semibold",
          question.prompt ? "text-portal-text1" : "text-portal-text3 italic",
        )}>
        {question.prompt || "Untitled question"}
      </span>
      <Chip label={questionTypeLabel(question.type)} />
      <button
        type="button"
        title={question.required ? "Make optional" : "Make required"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleRequired();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 cursor-pointer">
        <Chip
          label={question.required ? "Required" : "Optional"}
          active={question.required}
        />
      </button>
      <InlineConfirmDelete
        onDelete={onDelete}
        idleTitle="Delete question"
        size={12}
        idleClassName="border-portal-border flex h-[26px] w-[26px] items-center justify-center rounded-md border text-red-500 hover:bg-red-50"
      />
    </div>
  );
}
