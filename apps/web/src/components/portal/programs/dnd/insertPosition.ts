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

/** Horizontal counterpart of isInsertAfter, for session columns — whether a
 * drop should land after (vs. before) the hovered column, based on which
 * half of its width the pointer is currently over. */
export function isInsertAfterHorizontal(
  pointerX: number | null,
  over: Over | null,
): boolean {
  if (pointerX == null || !over) return false;
  return pointerX > over.rect.left + over.rect.width / 2;
}
