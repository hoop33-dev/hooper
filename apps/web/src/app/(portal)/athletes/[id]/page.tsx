import { AthleteTrainingTab } from "@/src/components/portal/athletes/AthleteTrainingTab";
import { mergeAthletePrograms } from "@/src/lib/athletePrograms";
import {
  getAthleteById,
  listPackageProgramsForAthlete,
} from "@/src/services/athlete.service";
import { getAthleteProgramProgress } from "@/src/services/programProgress.service";
import { listTeamsForAthlete } from "@/src/services/team.service";
import { notFound } from "next/navigation";

/** The Programs & teams tab. The loaders are cache()'d, so on a full load
 * this reuses the layout's fetches; only progress is this tab's own. */
export default async function AthleteTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athleteResult, teamsResult, packageProgramsResult] = await Promise.all(
    [
      getAthleteById(id),
      listTeamsForAthlete(id),
      listPackageProgramsForAthlete(id),
    ],
  );
  if (!athleteResult.ok) notFound();

  // Progress for every program the athlete sees, package and team ones
  // included.
  const programIds = [
    ...new Set(
      mergeAthletePrograms(
        athleteResult.data.programs,
        packageProgramsResult.ok ? packageProgramsResult.data : [],
        teamsResult.ok ? teamsResult.data : [],
      ).map((p) => p.id),
    ),
  ];
  const progressResult = await getAthleteProgramProgress(id, programIds);

  return (
    <AthleteTrainingTab
      programStats={progressResult.ok ? progressResult.data : {}}
    />
  );
}
