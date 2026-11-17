/**
 * Minimal class-name joiner. Filters falsy values and joins with a space.
 *
 * Kept dependency-free for scaffolding. Swap for clsx + tailwind-merge if
 * conflicting Tailwind classes become a problem.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
