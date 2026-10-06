"use client";

import { cn } from "@/src/lib/cn";
import { SpinnerIcon, XIcon } from "./icons";
import { useInlineConfirm } from "./useInlineConfirm";

interface InlineConfirmDeleteProps {
  onDelete: () => void | Promise<void>;
  /** Title/classes for the idle (X icon) state — callers vary reveal-on-hover
   * and hover color, so these aren't baked in. */
  idleTitle?: string;
  idleClassName: string;
  size?: number;
}

/** An icon-sized delete control that pops an inline "Confirm" chip in place
 * of the X on first click (no modal, no re-clicking the same spot), then
 * swaps to a spinner while the actual delete is in flight. */
export function InlineConfirmDelete({
  onDelete,
  idleTitle = "Delete",
  idleClassName,
  size = 11,
}: InlineConfirmDeleteProps) {
  const { armed, confirming, arm, confirm } = useInlineConfirm(onDelete);

  if (confirming) {
    return (
      <span
        className="flex flex-shrink-0 items-center justify-center"
        style={{ width: size, height: size }}>
        <SpinnerIcon size={size} />
      </span>
    );
  }

  if (armed) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          confirm();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 rounded border border-red-500 px-1.5 py-0.5 text-[10px] leading-none font-bold whitespace-nowrap text-red-500 hover:bg-red-50">
        Confirm
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        arm();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      title={idleTitle}
      className={cn("flex-shrink-0 transition-opacity", idleClassName)}>
      <XIcon size={size} />
    </button>
  );
}
