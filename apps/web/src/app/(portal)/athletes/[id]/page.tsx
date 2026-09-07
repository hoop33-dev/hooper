import { AthleteDetailShell } from "@/src/components/portal/athletes/AthleteDetailShell";
import { getAthleteById } from "@/src/services/athlete.service";
import { getAthleteProgramProgress } from "@/src/services/programProgress.service";
import { notFound } from "next/navigation";
import {
  assignProgramToAthleteAction,
  listAssignableProgramsAction,
  unassignProgramFromAthleteAction,
} from "../actions";

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athleteResult = await getAthleteById(id);

  if (!athleteResult.ok) notFound();

  const progressResult = await getAthleteProgramProgress(
    id,
    athleteResult.data.programs.map((p) => p.id),
  );
  const programStats = progressResult.ok ? progressResult.data : {};

  return (
    <AthleteDetailShell
      athlete={athleteResult.data}
      programStats={programStats}
      loadPrograms={listAssignableProgramsAction}
      assignProgramAction={assignProgramToAthleteAction}
      unassignProgramAction={unassignProgramFromAthleteAction}
    />
  );
}
