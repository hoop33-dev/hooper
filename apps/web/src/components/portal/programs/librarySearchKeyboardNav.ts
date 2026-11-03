import type { KeyboardEvent } from "react";

/** Clamps (never wraps) a selection index to the current list length —
 * shared by every library search input's arrow-key navigation. */
export function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

export interface LibrarySearchNavHandlers {
  itemCount: number;
  /** null means no row is arrow-selected yet — no highlight is shown until
   * the first arrow press, and it resets to null whenever the search text
   * changes. */
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number) => void;
  onQuickAdd: () => void;
}

/** Shared `onKeyDown` for every library search `<input>`. Arrow Left/Right
 * move the selection cursor through the currently-filtered list (clamped,
 * not wrapped) instead of moving the text caret — the caret movement is
 * intentionally sacrificed here. The first arrow press (from no selection)
 * always lands on index 0 regardless of direction. Shift+A triggers "add
 * selected" instead of typing a capital "A" into the field. Escape blurs
 * the field, handing focus (and the global shortcuts) back to the page.
 * All branches bail on any other modifier so this never fights a real
 * browser/OS shortcut. */
export function handleLibrarySearchKeyDown(
  e: KeyboardEvent<HTMLInputElement>,
  h: LibrarySearchNavHandlers,
): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Escape") {
    e.currentTarget.blur();
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const delta = e.key === "ArrowLeft" ? -1 : 1;
    const current = h.selectedIndex ?? -1;
    h.onSelectedIndexChange(clampIndex(current + delta, h.itemCount));
    return;
  }
  if (e.shiftKey && e.key.toLowerCase() === "a") {
    e.preventDefault();
    h.onQuickAdd();
  }
}
