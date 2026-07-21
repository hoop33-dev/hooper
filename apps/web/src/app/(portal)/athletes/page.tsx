import { AthletesPageShell } from "@/src/components/portal/athletes/AthletesPageShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { listAthletesForCoach } from "@/src/services/athlete.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { listPrograms } from "@/src/services/program.service";
import { listTeams } from "@/src/services/team.service";
import {
  assignProgramToPlayerAction,
  assignProgramToTeamAction,
} from "../programs/[id]/actions";
import {
  createTeamAction,
  listAssignmentsForPlayerAction,
  revokeAssignmentAction,
} from "./actions";

export default async function AthletesPage() {
  const profileResult = await getCoachProfile();
  const profileId = profileResult.ok ? profileResult.data.id : "";

  const [athletesResult, teamsResult, programsResult] = await Promise.all([
    listAthletesForCoach(profileId),
    listTeams(),
    listPrograms(),
  ]);

  const athletes = athletesResult.ok ? athletesResult.data : [];
  const teams = teamsResult.ok ? teamsResult.data : [];
  const programs = programsResult.ok ? programsResult.data : [];

  async function wrappedCreate(name: string) {
    "use server";
    return createTeamAction(name, profileId);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Athletes"
        subtitle="Group athletes into teams and assign them programs"
      />
      <AthletesPageShell
        athletes={athletes}
        teams={teams}
        programs={programs}
        profileId={profileId}
        createTeamAction={wrappedCreate}
        loadAssignmentsAction={listAssignmentsForPlayerAction}
        revokeAssignmentAction={revokeAssignmentAction}
        assignToTeamAction={assignProgramToTeamAction}
        assignToPlayerAction={assignProgramToPlayerAction}
      />
    </div>
  );
}
