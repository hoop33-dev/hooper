import { cn } from "@/src/lib/cn";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-base",
} as const;

/** Rounded orange-soft tile with the first letter of `name` — the
 * placeholder cover for programs (and anything else without an image). */
export function LetterTile({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <div
      className={cn(
        "bg-portal-orange-soft text-portal-orange flex flex-shrink-0 items-center justify-center rounded-lg font-extrabold",
        SIZES[size],
      )}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
