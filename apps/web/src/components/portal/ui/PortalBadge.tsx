"use client";

import { cn } from "@/src/lib/cn";
import { useRef, useState } from "react";

interface PortalBadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "neutral" | "green" | "blue" | "red";
  className?: string;
  /** Hover text. A `truncate` badge without one shows its own full text,
   * and only when it's been cut. */
  title?: string;
  /** For text that can run long (e.g. a package name): cut it with an
   * ellipsis to the width `className` allows. Without it the badge never
   * wraps or shrinks. */
  truncate?: boolean;
  /** On a `truncate` badge, kept whole after the cut text (e.g. "+2"). */
  suffix?: React.ReactNode;
}

const variants = {
  orange: "bg-portal-orange-soft text-portal-orange",
  neutral: "bg-portal-border text-portal-text2",
  green: "bg-green-50 text-green-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-600",
};

const BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold";

export function PortalBadge({
  children,
  variant = "neutral",
  className,
  title,
  truncate = false,
  suffix,
}: PortalBadgeProps) {
  if (truncate) {
    return (
      <TruncatingBadge
        className={className}
        badgeClass={variants[variant]}
        title={title}
        suffix={suffix}>
        {children}
      </TruncatingBadge>
    );
  }
  return (
    <span
      title={title}
      className={cn(
        BASE,
        "shrink-0 whitespace-nowrap",
        variants[variant],
        className,
      )}>
      {children}
    </span>
  );
}

function TruncatingBadge({
  children,
  className,
  badgeClass,
  title,
  suffix,
}: {
  children: React.ReactNode;
  className?: string;
  badgeClass: string;
  title?: string;
  suffix?: React.ReactNode;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  return (
    <span
      className={cn("group relative inline-flex min-w-0", className)}
      onPointerEnter={() => {
        const el = textRef.current;
        setCut(!!el && el.scrollWidth > el.clientWidth);
      }}>
      <span className={cn(BASE, "min-w-0 gap-1", badgeClass)}>
        <span ref={textRef} className="truncate">
          {children}
        </span>
        {suffix != null && <span className="shrink-0">{suffix}</span>}
      </span>
      {(title || cut) && (
        <span
          role="tooltip"
          className="bg-portal-text1 pointer-events-none absolute right-0 bottom-full z-20 mb-1.5 rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          {title ?? children}
        </span>
      )}
    </span>
  );
}
