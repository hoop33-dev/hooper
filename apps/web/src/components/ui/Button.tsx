import { cn } from "@/src/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * Button primitive — Courtside Kinetic.
 *
 * Fully rounded. Orange is reserved for the primary CTA; secondary actions sit
 * on Navy. No borders — elevation comes from colour.
 */
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-orange text-white hover:brightness-110 active:brightness-95",
  secondary: "bg-navy text-white hover:brightness-125 active:brightness-110",
  ghost:
    "bg-transparent text-white/80 hover:bg-surface-container-high hover:text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
