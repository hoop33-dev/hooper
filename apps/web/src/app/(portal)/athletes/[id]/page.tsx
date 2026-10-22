import { AthleteDetailShell } from "@/src/components/portal/athletes/AthleteDetailShell";
import { mergeAthletePrograms } from "@/src/lib/athletePrograms";
import {
  getAthleteById,
  listPackageProgramsForAthlete,
} from "@/src/services/athlete.service";
import { listPrograms } from "@/src/services/program.service";
import { getAthleteProgramProgress } from "@/src/services/programProgress.service";
import { listTeams, listTeamsForAthlete } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import {
  addAthleteToTeamAction,
  assignProgramToAthleteAction,
  removeAthleteFromTeamAction,
  unassignProgramFromAthleteAction,
} from "../actions";

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    athleteResult,
    teamsResult,
    packageProgramsResult,
    allTeamsResult,
    programsResult,
  ] = await Promise.all([
    getAthleteById(id),
    listTeamsForAthlete(id),
    listPackageProgramsForAthlete(id),
    listTeams(),
    listPrograms(),
  ]);

  if (!athleteResult.ok) notFound();

  const teams = teamsResult.ok ? teamsResult.data : [];
  const packagePrograms = packageProgramsResult.ok
    ? packageProgramsResult.data
    : [];
  // Progress for every program the athlete sees, package and team ones
  // included.
  const programIds = [
    ...new Set(
      mergeAthletePrograms(
        athleteResult.data.programs,
        packagePrograms,
        teams,
      ).map((p) => p.id),
    ),
  ];
  const progressResult = await getAthleteProgramProgress(id, programIds);

  return (
    <AthleteDetailShell
      athlete={athleteResult.data}
      teams={teams}
      packagePrograms={packagePrograms}
      allTeams={allTeamsResult.ok ? allTeamsResult.data : []}
      allPrograms={programsResult.ok ? programsResult.data : []}
      programStats={progressResult.ok ? progressResult.data : {}}
      assignProgramAction={assignProgramToAthleteAction}
      unassignProgramAction={unassignProgramFromAthleteAction}
      addToTeamAction={addAthleteToTeamAction}
      removeFromTeamAction={removeAthleteFromTeamAction}
    />
  );
}
