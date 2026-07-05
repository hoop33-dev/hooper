"use client";

import { cn } from "@/src/lib/cn";
import { useDraggable } from "@dnd-kit/core";

interface DraggableBlockTemplateRowProps {
  blockTemplateId: string;
  name: string;
  exerciseCount: number;
  variant?: "list" | "card";
}

export function DraggableBlockTemplateRow({
  blockTemplateId,
  name,
  exerciseCount,
  variant = "list",
}: DraggableBlockTemplateRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-template:${blockTemplateId}`,
  });

  const countLabel = `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`;

  if (variant === "card") {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "border-portal-border bg-portal-bg w-[136px] flex-shrink-0 cursor-grab rounded-lg border px-2.5 py-2 select-none active:cursor-grabbing",
          isDragging && "opacity-30",
        )}>
        <div className="text-portal-text1 truncate text-[11px] font-bold">
          {name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-[9px]">
          {countLabel}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "border-portal-border hover:bg-portal-orange-soft flex cursor-grab items-center gap-2 border-b px-3.5 py-2.5 select-none active:cursor-grabbing",
        isDragging && "opacity-30",
      )}>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[12px] font-semibold">
          {name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-[10px]">
          {countLabel}
        </div>
      </div>
    </div>
  );
}
