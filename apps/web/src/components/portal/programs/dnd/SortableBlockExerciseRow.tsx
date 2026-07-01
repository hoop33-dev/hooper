"use client";

import { cn } from "@/src/lib/cn";
import { formatMeasurementSummary } from "@/src/lib/measurementFormat";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockExerciseWithDetails } from "@hooper/db";

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

function XIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

interface SortableBlockExerciseRowProps {
  blockExercise: BlockExerciseWithDetails;
  readOnly?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
}

export function SortableBlockExerciseRow({
  blockExercise,
  readOnly,
  onOpen,
  onRemove,
}: SortableBlockExerciseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `block-exercise:${blockExercise.id}`,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-portal-border flex items-center gap-2 border-b px-3 py-2 last:border-b-0",
        isDragging && "opacity-30",
        !readOnly && "hover:bg-portal-bg cursor-pointer",
      )}
      onClick={readOnly ? undefined : onOpen}>
      {!readOnly && (
        <button
          type="button"
          className="text-portal-text3 flex-shrink-0 cursor-grab touch-none active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}>
          <GripIcon />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[12px] font-semibold">
          {blockExercise.exercise.name}
        </div>
      </div>
      <div className="text-portal-text3 flex-shrink-0 text-[11px]">
        {formatMeasurementSummary(blockExercise)}
      </div>
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-portal-text3 hover:text-portal-text1 flex-shrink-0">
          <XIcon />
        </button>
      )}
    </div>
  );
}
