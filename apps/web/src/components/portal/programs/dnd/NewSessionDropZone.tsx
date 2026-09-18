"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { newSessionDropId } from "./useBlockExerciseDnd";

interface NewSessionDropZoneProps {
  weekNumber: number;
  children: ReactNode;
  className?: string;
}

/** Wraps the "+ Add session" trigger so dropping a library exercise onto it
 * opens the session-create modal seeded with that exercise — once the user
 * names the session, a new block gets created and the exercise added to it. */
export function NewSessionDropZone({
  weekNumber,
  children,
  className,
}: NewSessionDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: newSessionDropId(weekNumber),
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
