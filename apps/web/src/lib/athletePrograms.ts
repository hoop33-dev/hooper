import type { AssignedProgramRef, AthletePackageProgram } from "@hooper/db";

/** How the athlete gets a program: assigned directly (and so removable
 * here), through a package they've bought, or through a team they're on. */
export type AthleteProgramVia =
  | { kind: "direct" }
  | { kind: "package"; package: { id: string; name: string } }
  | { kind: "team"; team: string };

export type AthleteProgramEntry = AssignedProgramRef & {
  /** Unique per row — the same program can appear once per source. */
  key: string;
  via: AthleteProgramVia;
};

/**
 * Every program an athlete can see, one row per way they get it: direct
 * assignments first, then package programs, then team programs. Nothing is
 * de-duped, so a program that's direct and via a team (or via two
 * packages) is listed once for each.
 */
export function mergeAthletePrograms(
  direct: AssignedProgramRef[],
  packagePrograms: AthletePackageProgram[],
  teams: { id: string; name: string; programs: AssignedProgramRef[] }[],
): AthleteProgramEntry[] {
  return [
    ...direct.map((p) => ({
      id: p.id,
      name: p.name,
      key: `direct-${p.id}`,
      via: { kind: "direct" } as const,
    })),
    ...packagePrograms.map((p) => ({
      id: p.id,
      name: p.name,
      key: `package-${p.package.id}-${p.id}`,
      via: { kind: "package", package: p.package } as const,
    })),
    ...teams.flatMap((team) =>
      team.programs.map((p) => ({
        id: p.id,
        name: p.name,
        key: `team-${team.id}-${p.id}`,
        via: { kind: "team", team: team.name } as const,
      })),
    ),
  ];
}
