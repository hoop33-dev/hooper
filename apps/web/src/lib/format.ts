import type { ProgramSummary } from "@hooper/db";

/** "1 program" / "3 programs". `many` defaults to `one` + "s". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Dates are shown in NZ time wherever they render. Formatting in the
 * runtime's zone would make the server (UTC) and the browser disagree on
 * the day near midnight, a hydration mismatch in client components. */
export const PORTAL_TIME_ZONE = "Pacific/Auckland";

/** "Sep 30, 2026", in NZ time. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PORTAL_TIME_ZONE,
  });
}

/** "3/wk", "2-4/wk", or "no sessions yet". */
export function formatSessionsPerWeek(
  range: ProgramSummary["sessionsPerWeek"],
): string {
  if (!range) return "no sessions yet";
  const [min, max] = range;
  return min === max ? `${min}/wk` : `${min}-${max}/wk`;
}

/** "8 wk · 3/wk" — the program sub-line on detail cards and pickers. */
export function formatProgramSub(program: {
  weeks: number;
  sessionsPerWeek: ProgramSummary["sessionsPerWeek"];
}): string {
  return `${program.weeks} wk · ${formatSessionsPerWeek(program.sessionsPerWeek)}`;
}
