"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { newBlockDropId } from "./useBlockExerciseDnd";

interface NewBlockDropZoneProps {
  sessionId: string;
  children: ReactNode;
  className?: string;
}

/** Wraps the "+ Add block" trigger so dropping a library exercise onto it
 * creates a new block in this session, pre-populated with that exercise. */
export function NewBlockDropZone({
  sessionId,
  children,
  className,
}: NewBlockDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: newBlockDropId(sessionId),
  });

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
