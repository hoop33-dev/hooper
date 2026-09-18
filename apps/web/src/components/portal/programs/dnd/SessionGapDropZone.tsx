"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDragIndicator } from "./DragIndicatorContext";

interface SessionGapDropZoneProps {
  /** See sessionGapDropId in useBlockExerciseDnd.ts. */
  id: string;
  /** Id of the session column immediately to the left of this gap, if any —
   * dragging a column over that card's right half reorders it to land here. */
  beforeSessionId?: string | null;
  /** Id of the session column immediately to the right of this gap, if any —
   * dragging a column over that card's left half reorders it to land here. */
  afterSessionId?: string | null;
}

function draggedSessionId(activeId: string | null): string | null {
  if (!activeId?.startsWith("session-col:")) return null;
  return activeId.slice("session-col:".length);
}

/**
 * The exact insertion point between two session columns (or before the
 * first / after the last) — a vertical line, matching BlockGapDropZone's
 * horizontal-line treatment for blocks. Also lights up when a column is
 * dragged over one of its neighbors' near half, not just this exact strip —
 * the same "hover the card, the adjacent gap answers" treatment
 * BlockGapDropZone gives blocks.
 */
export function SessionGapDropZone({
  id,
  beforeSessionId,
  afterSessionId,
}: SessionGapDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const indicator = useDragIndicator();

  const dragged = draggedSessionId(indicator.activeId);
  const hoveringAfterFromLeft =
    !!afterSessionId &&
    afterSessionId !== dragged &&
    indicator.overId === `session-col:${afterSessionId}` &&
    !indicator.after;
  const hoveringBeforeFromRight =
    !!beforeSessionId &&
    beforeSessionId !== dragged &&
    indicator.overId === `session-col:${beforeSessionId}` &&
    indicator.after;

  const highlighted =
    isOver || hoveringAfterFromLeft || hoveringBeforeFromRight;

  return (
    <div ref={setNodeRef} className="relative w-3 flex-shrink-0 self-stretch">
      {highlighted && (
        <div className="bg-portal-orange pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full" />
      )}
    </div>
  );
}
