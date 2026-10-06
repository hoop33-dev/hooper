"use client";

import { createContext, useContext } from "react";

export type DragIndicator = {
  /** DnD id of the item being dragged, or null when idle. */
  activeId: string | null;
  /** DnD id of the current drop target, or null. */
  overId: string | null;
  /** Whether the drop would land after (vs. before) the over target. */
  after: boolean;
};

const EMPTY: DragIndicator = { activeId: null, overId: null, after: false };

/**
 * Broadcasts the live drop target so rows/blocks can render an insertion line
 * that follows the pointer continuously — `useSortable`'s `over` only changes
 * when the target item changes, so it can't tell top-half from bottom-half of
 * the same item. This is fed from the DndContext's `onDragMove`.
 */
export const DragIndicatorContext = createContext<DragIndicator>(EMPTY);

export function useDragIndicator(): DragIndicator {
  return useContext(DragIndicatorContext);
}
