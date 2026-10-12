import type { AssignedProgramRef } from "@hooper/db";

export type AthleteProgramEntry = AssignedProgramRef & {
  /** Name of the team the program comes through, or null when it's
   * assigned to the athlete directly (and so removable here). */
  viaTeam: string | null;
};

/**
 * Every program an athlete can see: direct assignments first, then those
 * that come through a team they're on. A program that's both direct and via
 * a team is listed once, as direct — removing the direct assignment is the
 * only thing the athlete page can do with it. A program on several teams
 * credits the first team.
 */
export function mergeAthletePrograms(
  direct: AssignedProgramRef[],
  teams: { name: string; programs: AssignedProgramRef[] }[],
): AthleteProgramEntry[] {
  const seen = new Set<string>();
  const entries: AthleteProgramEntry[] = [];
  for (const program of direct) {
    if (seen.has(program.id)) continue;
    seen.add(program.id);
    entries.push({ ...program, viaTeam: null });
  }
  for (const team of teams) {
    for (const program of team.programs) {
      if (seen.has(program.id)) continue;
      seen.add(program.id);
      entries.push({ ...program, viaTeam: team.name });
    }
  }
  return entries;
}
