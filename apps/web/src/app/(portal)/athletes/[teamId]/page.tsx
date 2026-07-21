import { TeamRosterShell } from "@/src/components/portal/athletes/TeamRosterShell";
import { listAssignmentsForTeam } from "@/src/services/assignment.service";
import { getTeamWithMembers } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import {
  addTeamMemberAction,
  deleteTeamAction,
  lookupAthleteByUsernameAction,
  removeTeamMemberAction,
  renameTeamAction,
  revokeAssignmentAction,
} from "../actions";

export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [teamResult, assignmentsResult] = await Promise.all([
    getTeamWithMembers(teamId),
    listAssignmentsForTeam(teamId),
  ]);
  if (!teamResult.ok) notFound();

  const assignments = assignmentsResult.ok ? assignmentsResult.data : [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TeamRosterShell
        team={teamResult.data}
        assignments={assignments}
        renameAction={renameTeamAction}
        deleteAction={deleteTeamAction}
        addMemberAction={addTeamMemberAction}
        removeMemberAction={removeTeamMemberAction}
        lookupAthleteAction={lookupAthleteByUsernameAction}
        revokeAssignmentAction={revokeAssignmentAction}
      />
    </div>
  );
}
