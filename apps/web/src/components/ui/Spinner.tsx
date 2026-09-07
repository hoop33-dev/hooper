import { cn } from "@/src/lib/cn";

interface SpinnerProps {
  className?: string;
  label?: string;
}

/**
 * Spinner primitive — Courtside Kinetic. Orange accent on a transparent track.
 */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "border-t-primary-orange inline-block size-5 animate-spin rounded-full border-2 border-white/20",
        className,
      )}
    />
  );
}
