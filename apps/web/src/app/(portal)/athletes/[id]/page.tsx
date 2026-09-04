import { AthleteDetailShell } from "@/src/components/portal/athletes/AthleteDetailShell";
import { getAthleteById } from "@/src/services/athlete.service";
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

  return (
    <AthleteDetailShell
      athlete={athleteResult.data}
      loadPrograms={listAssignableProgramsAction}
      assignProgramAction={assignProgramToAthleteAction}
      unassignProgramAction={unassignProgramFromAthleteAction}
    />
  );
}
