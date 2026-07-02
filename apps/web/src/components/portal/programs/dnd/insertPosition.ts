import type { Active, Over } from "@dnd-kit/core";

/**
 * Whether a hovered sortable item should receive the drop after itself
 * (vs. before), based on the dragged item's current vertical center
 * relative to the hovered item's midpoint. Used to render a single,
 * accurately-positioned insertion line instead of one that's always
 * pinned to a fixed edge regardless of where the pointer actually is.
 */
export function isInsertAfter(
  active: Active | null,
  over: Over | null,
): boolean {
  if (!active || !over) return false;
  const activeTop = active.rect.current.translated?.top;
  if (activeTop == null) return false;
  return activeTop > over.rect.top + over.rect.height / 2;
}
