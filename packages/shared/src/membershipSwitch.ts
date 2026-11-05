/** "Switching to X" while a package a coach switched away from runs out,
 * "Switched to X" once it has ended; null if it wasn't switched. Shared so
 * the coach portal and the billing portal word it the same. */
export function switchLabel(
  switchedTo: string | null | undefined,
  ended: boolean,
): string | null {
  if (!switchedTo) return null;
  return `${ended ? "Switched" : "Switching"} to ${switchedTo}`;
}
