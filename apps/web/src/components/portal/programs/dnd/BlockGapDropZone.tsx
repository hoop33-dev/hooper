"use client";

import { cn } from "@/src/lib/cn";
import { useDroppable } from "@dnd-kit/core";
import { useDragIndicator } from "./DragIndicatorContext";

interface BlockGapDropZoneProps {
  /** See blockGapDropId in useBlockExerciseDnd.ts. */
  id: string;
  /** Id of the block immediately above this gap, if any — dragging a block
   * over that card's bottom half reorders it to land here. */
  beforeBlockId?: string | null;
  /** Id of the block immediately below this gap, if any — dragging a block
   * over that card's top half reorders it to land here. */
  afterBlockId?: string | null;
  dense?: boolean;
}

function draggedBlockId(activeId: string | null): string | null {
  if (!activeId?.startsWith("block:")) return null;
  return activeId.slice("block:".length);
}

function isBlockLikeDrag(activeId: string | null): boolean {
  return (
    !!activeId &&
    (activeId.startsWith("block:") ||
      activeId.startsWith("block-template:") ||
      activeId.startsWith("session-template:"))
  );
}

/**
 * The exact insertion point between two block cards (or before the first /
 * after the last) — fills what would otherwise be dead space the pointer
 * falls through to the whole session column, which used to make an
 * in-between drop silently land at the end of the list instead. Dropping a
 * block/template here inserts it at this position; dropping a bare exercise
 * creates a new block here containing it.
 *
 * Also lights up when a block/template is dragged over one of its
 * neighboring cards rather than this exact strip — reordering blocks always
 * shows the line here, between the two cards, instead of as a border on the
 * hovered card itself (that treatment is reserved for exercises, which can
 * actually land inside a block).
 */
export function BlockGapDropZone({
  id,
  beforeBlockId,
  afterBlockId,
  dense,
}: BlockGapDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const indicator = useDragIndicator();

  const dragged = draggedBlockId(indicator.activeId);
  const blockLike = isBlockLikeDrag(indicator.activeId);
  const hoveringAfterFromAbove =
    blockLike &&
    !!afterBlockId &&
    afterBlockId !== dragged &&
    indicator.overId === `block:${afterBlockId}` &&
    !indicator.after;
  const hoveringBeforeFromBelow =
    blockLike &&
    !!beforeBlockId &&
    beforeBlockId !== dragged &&
    indicator.overId === `block:${beforeBlockId}` &&
    indicator.after;

  const highlighted =
    isOver || hoveringAfterFromAbove || hoveringBeforeFromBelow;

  return (
    <div
      ref={setNodeRef}
      className={cn("relative shrink-0", dense ? "h-2" : "h-3")}>
      {highlighted && (
        <div className="bg-portal-orange pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full" />
      )}
    </div>
  );
}
