"use client";

import { cn } from "@/src/lib/cn";
import { useDraggable } from "@dnd-kit/core";
import type { ExerciseWithDetails } from "@hooper/db";
import { ExerciseVideoThumbnail } from "../../exercises/ExerciseVideoThumbnail";

interface DraggableLibraryRowProps {
  exercise: ExerciseWithDetails;
  variant?: "list" | "card";
  /** Opens the read-only preview modal — fires on a plain click, since the
   * DndContext's PointerSensor only starts a drag past its 8px activation
   * distance, leaving a no-movement click free for this. */
  onOpen?: (exercise: ExerciseWithDetails) => void;
  /** Highlights this row as the current keyboard-arrow selection — the
   * target of the Shift+A "quick add" shortcut. */
  isSelected?: boolean;
}

/** "Reps", or "1 variant, Reps" / "3 variants, Reps" once the exercise has
 * variants (e.g. "Ab Roller") — a base exercise's own `variants` is only
 * ever populated on the base itself (single-level nesting), so a variant's
 * own card never gets this prefix. */
function libraryCardSubtitle(exercise: ExerciseWithDetails): string {
  const unitTypeText = exercise.unitTypes[0] ?? "No unit type";
  const count = exercise.variants.length;
  if (count === 0) return unitTypeText;
  return `${count} variant${count === 1 ? "" : "s"}, ${unitTypeText}`;
}

export function DraggableLibraryRow({
  exercise,
  variant = "list",
  onOpen,
  isSelected = false,
}: DraggableLibraryRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library:${exercise.id}`,
  });
  const subtitle = libraryCardSubtitle(exercise);

  if (variant === "card") {
    return (
      <div
        ref={setNodeRef}
        onClick={() => onOpen?.(exercise)}
        {...attributes}
        {...listeners}
        className={cn(
          "border-portal-border bg-portal-bg w-[136px] flex-shrink-0 cursor-grab overflow-hidden rounded-lg border select-none active:cursor-grabbing",
          isDragging && "opacity-30",
          isSelected && "border-portal-orange ring-portal-orange ring-1",
        )}>
        <ExerciseVideoThumbnail
          exercise={exercise}
          className="h-[76px] w-full"
          fallbackClassName="text-sm"
        />
        <div className="px-2.5 py-2">
          <div className="text-portal-text1 truncate text-[11px] font-bold">
            {exercise.name}
          </div>
          <div className="text-portal-text3 mt-0.5 truncate text-[9px]">
            {subtitle}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={() => onOpen?.(exercise)}
      {...attributes}
      {...listeners}
      className={cn(
        "border-portal-border hover:bg-portal-orange-soft flex cursor-grab items-center gap-2 border-b px-3.5 py-2.5 select-none active:cursor-grabbing",
        isDragging && "opacity-30",
        isSelected && "bg-portal-orange-soft border-portal-orange",
      )}>
      <ExerciseVideoThumbnail
        exercise={exercise}
        className="h-9 w-16 flex-shrink-0 rounded-md"
        fallbackClassName="text-[10px]"
      />
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[12px] font-semibold">
          {exercise.name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-[10px]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
