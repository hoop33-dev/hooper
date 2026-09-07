import { cn } from "@/src/lib/cn";
import type { HTMLAttributes } from "react";

/**
 * Card primitive — Courtside Kinetic.
 *
 * Reads as elevated purely through a surface tier shift (no border). Rounded
 * with an ambient shadow.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-container shadow-ambient rounded-3xl p-6",
        className,
      )}
      {...props}
    />
  );
}
