"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { NEW_BLOCK_DROP_ID } from "./useBlockExerciseDnd";

interface NewBlockDropZoneProps {
  children: ReactNode;
  className?: string;
}

/** Wraps the "+ Add block" trigger so dropping a library exercise onto it
 * creates a new block pre-populated with that exercise. */
export function NewBlockDropZone({
  children,
  className,
}: NewBlockDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_BLOCK_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "border-portal-orange bg-portal-orange-soft",
      )}>
      {children}
    </div>
  );
}
