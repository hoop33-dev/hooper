import { TeamDetailShell } from "@/src/components/portal/athletes/teams/TeamDetailShell";
import { listAthletes } from "@/src/services/athlete.service";
import { getTeamById } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import { listAssignableProgramsAction } from "../../actions";
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
  const [teamResult, athletesResult] = await Promise.all([
    getTeamById(id),
    listAthletes(),
  ]);

  if (!teamResult.ok) notFound();

  const athletes = athletesResult.ok ? athletesResult.data : [];

  return (
    <TeamDetailShell
      team={teamResult.data}
      loadPrograms={listAssignableProgramsAction}
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
