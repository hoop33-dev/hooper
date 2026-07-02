import type { Over } from "@dnd-kit/core";

/**
 * Whether a hovered sortable item should receive the drop after itself
 * (vs. before), based on the pointer's current vertical position relative to
 * the hovered item's midpoint. Used to render a single,
 * accurately-positioned insertion line instead of one that's always
 * pinned to a fixed edge regardless of where the pointer actually is.
 */
export function isInsertAfter(
  pointerY: number | null,
  over: Over | null,
): boolean {
  if (pointerY == null || !over) return false;
  return pointerY > over.rect.top + over.rect.height / 2;
}

/**
 * Block cards should drop from their header to the bottom edge, so the line
 * shows below the card when the pointer is still in the header area.
 */
export function isInsertAfterForBlockTarget(
  pointerY: number | null,
  over: Over | null,
): boolean {
  if (pointerY == null || !over) return false;

  const headerBottom = over.rect.top + Math.min(44, over.rect.height * 0.4);
  if (pointerY <= headerBottom) return true;

  return isInsertAfter(pointerY, over);
}
