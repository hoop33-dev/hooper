"use client";

import { cn } from "@/src/lib/cn";
import { useDraggable } from "@dnd-kit/core";
import type { ExerciseWithDetails } from "@hooper/db";

interface DraggableLibraryRowProps {
  exercise: ExerciseWithDetails;
  variant?: "list" | "card";
  /** Opens the read-only preview modal — fires on a plain click, since the
   * DndContext's PointerSensor only starts a drag past its 8px activation
   * distance, leaving a no-movement click free for this. */
  onOpen?: (exercise: ExerciseWithDetails) => void;
}

export function DraggableLibraryRow({
  exercise,
  variant = "list",
  onOpen,
}: DraggableLibraryRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library:${exercise.id}`,
  });

  if (variant === "card") {
    return (
      <div
        ref={setNodeRef}
        onClick={() => onOpen?.(exercise)}
        {...attributes}
        {...listeners}
        className={cn(
          "border-portal-border bg-portal-bg w-[136px] flex-shrink-0 cursor-grab rounded-lg border px-2.5 py-2 select-none active:cursor-grabbing",
          isDragging && "opacity-30",
        )}>
        <div className="text-portal-text1 truncate text-[11px] font-bold">
          {exercise.name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-[9px]">
          {exercise.unitTypes[0] ?? "No unit type"}
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
      )}>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[12px] font-semibold">
          {exercise.name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-[10px]">
          {exercise.unitTypes[0] ?? "No unit type"}
        </div>
      </div>
    </div>
  );
}
