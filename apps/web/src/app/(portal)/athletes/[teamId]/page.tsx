import { TeamRosterShell } from "@/src/components/portal/athletes/TeamRosterShell";
import { getTeamWithMembers } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import {
  addTeamMemberAction,
  deleteTeamAction,
  lookupAthleteByUsernameAction,
  removeTeamMemberAction,
  renameTeamAction,
} from "../actions";

export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const result = await getTeamWithMembers(teamId);
  if (!result.ok) notFound();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TeamRosterShell
        team={result.data}
        renameAction={renameTeamAction}
        deleteAction={deleteTeamAction}
        addMemberAction={addTeamMemberAction}
        removeMemberAction={removeTeamMemberAction}
        lookupAthleteAction={lookupAthleteByUsernameAction}
      />
    </div>
  );
}
