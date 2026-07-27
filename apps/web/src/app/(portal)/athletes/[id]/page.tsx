import { AthleteDetailShell } from "@/src/components/portal/athletes/AthleteDetailShell";
import { getAthleteById } from "@/src/services/athlete.service";
import { listPrograms } from "@/src/services/program.service";
import { notFound } from "next/navigation";
import {
  assignProgramToAthleteAction,
  unassignProgramFromAthleteAction,
} from "../actions";

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athleteResult, programsResult] = await Promise.all([
    getAthleteById(id),
    listPrograms(),
  ]);

  if (!athleteResult.ok) notFound();

  const programs = programsResult.ok ? programsResult.data : [];

  return (
    <AthleteDetailShell
      athlete={athleteResult.data}
      programs={programs}
      assignProgramAction={assignProgramToAthleteAction}
      unassignProgramAction={unassignProgramFromAthleteAction}
    />
  );
}
