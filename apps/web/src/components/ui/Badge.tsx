import { cn } from "@/src/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "orange" | "blue" | "salmon";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/**
 * Badge / chip primitive — Courtside Kinetic. Fully rounded.
 */
const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-container-highest text-white/70",
  orange: "bg-primary-orange/20 text-primary-orange",
  blue: "bg-blue/20 text-blue",
  salmon: "bg-salmon/20 text-salmon",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
