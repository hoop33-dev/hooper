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
  const [teamResult, athletesResult, programsResult] = await Promise.all([
    getTeamById(id),
    listAthletes(),
    listPrograms(),
  ]);

  if (!teamResult.ok) notFound();

  return (
    <TeamDetailShell
      team={teamResult.data}
      athletes={athletesResult.ok ? athletesResult.data : []}
      allPrograms={programsResult.ok ? programsResult.data : []}
      updateTeamAction={updateTeamAction}
      deleteTeamAction={deleteTeamAction}
      addTeamMemberAction={addTeamMemberAction}
      removeTeamMemberAction={removeTeamMemberAction}
      assignProgramAction={assignProgramToTeamAction}
      unassignProgramAction={unassignProgramFromTeamAction}
    />
  );
}
