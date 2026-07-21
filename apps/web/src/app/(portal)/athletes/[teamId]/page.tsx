import { TeamRosterShell } from "@/src/components/portal/athletes/TeamRosterShell";
import { listAssignmentsForTeam } from "@/src/services/assignment.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { listPrograms } from "@/src/services/program.service";
import { getTeamWithMembers } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import { assignProgramToTeamAction } from "../../programs/[id]/actions";
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
  const [teamResult, assignmentsResult, programsResult, profileResult] =
    await Promise.all([
      getTeamWithMembers(teamId),
      listAssignmentsForTeam(teamId),
      listPrograms(),
      getCoachProfile(),
    ]);
  if (!teamResult.ok) notFound();

  const assignments = assignmentsResult.ok ? assignmentsResult.data : [];
  const programs = programsResult.ok ? programsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TeamRosterShell
        team={teamResult.data}
        assignments={assignments}
        programs={programs}
        profileId={profileId}
        renameAction={renameTeamAction}
        deleteAction={deleteTeamAction}
        addMemberAction={addTeamMemberAction}
        removeMemberAction={removeTeamMemberAction}
        lookupAthleteAction={lookupAthleteByUsernameAction}
        revokeAssignmentAction={revokeAssignmentAction}
        assignToTeamAction={assignProgramToTeamAction}
      />
    </div>
  );
}
