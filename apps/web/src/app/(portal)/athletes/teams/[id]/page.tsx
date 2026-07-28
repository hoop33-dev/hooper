import { TeamDetailShell } from "@/src/components/portal/athletes/teams/TeamDetailShell";
import { listAthletes } from "@/src/services/athlete.service";
import { listPrograms } from "@/src/services/program.service";
import { getTeamById } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import {
  addTeamMemberAction,
  assignProgramToTeamAction,
  deleteTeamAction,
  removeTeamMemberAction,
  unassignProgramFromTeamAction,
  updateTeamAction,
} from "../actions";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamResult, programsResult, athletesResult] = await Promise.all([
    getTeamById(id),
    listPrograms(),
    listAthletes(),
  ]);

  if (!teamResult.ok) notFound();

  const programs = programsResult.ok ? programsResult.data : [];
  const athletes = athletesResult.ok ? athletesResult.data : [];

  return (
    <TeamDetailShell
      team={teamResult.data}
      programs={programs}
      athletes={athletes}
      updateTeamAction={updateTeamAction}
      deleteTeamAction={deleteTeamAction}
      addTeamMemberAction={addTeamMemberAction}
      removeTeamMemberAction={removeTeamMemberAction}
      assignProgramAction={assignProgramToTeamAction}
      unassignProgramAction={unassignProgramFromTeamAction}
    />
  );
}
