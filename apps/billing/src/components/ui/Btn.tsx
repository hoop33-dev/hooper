import { cn } from "@/src/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** The design's `Btn`: primary (orange), dark, ghost (white card), quiet
 * (text only), danger; sm 30px / md 38px / lg 46px. `ghostDark` is the ghost
 * variant used on the dark auth screens. */
export type BtnVariant =
  | "primary"
  | "dark"
  | "ghost"
  | "ghostDark"
  | "quiet"
  | "danger";
export type BtnSize = "sm" | "md" | "lg";

const VARIANT: Record<BtnVariant, string> = {
  primary: "bg-orange border-orange text-white",
  dark: "bg-ink border-ink text-white",
  ghost: "bg-bp-card border-bp-border text-bp-text1",
  ghostDark: "bg-transparent border-white/10 text-white",
  quiet: "bg-transparent border-transparent text-bp-text2",
  danger: "bg-bp-card border-danger/30 text-danger",
};

const SIZE: Record<BtnSize, string> = {
  sm: "h-[30px] px-3 rounded-lg text-[12.5px]",
  md: "h-[38px] px-4 rounded-lg text-[13.5px]",
  lg: "h-[46px] px-[22px] rounded-[10px] text-[15px]",
};

export function btnClass({
  variant = "ghost",
  size = "md",
  full,
  className,
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-[7px] border font-semibold whitespace-nowrap transition-opacity duration-180 ease-out disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    full && "w-full",
    className,
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  loading?: boolean;
};

export function Btn({
  variant,
  size,
  full,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={btnClass({ variant, size, full, className })}
      {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function BtnLink({
  href,
  variant,
  size,
  full,
  className,
  children,
}: {
  href: string;
  variant?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={btnClass({ variant, size, full, className })}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
