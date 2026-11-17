"use client";

import { cn } from "@/src/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-portal-orange text-white hover:brightness-110 active:brightness-95",
  secondary:
    "bg-portal-card border border-portal-border text-portal-text1 hover:bg-portal-border/50",
  ghost: "text-portal-text2 hover:bg-portal-border/50",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

export function PortalButton({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: PortalButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}>
      {children}
    </button>
  );
}
