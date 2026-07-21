import { AthletesPageShell } from "@/src/components/portal/athletes/AthletesPageShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { listAthletesForCoach } from "@/src/services/athlete.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { listTeams } from "@/src/services/team.service";
import {
  createTeamAction,
  listAssignmentsForPlayerAction,
  revokeAssignmentAction,
} from "./actions";

export default async function AthletesPage() {
  const profileResult = await getCoachProfile();
  const profileId = profileResult.ok ? profileResult.data.id : "";

  const [athletesResult, teamsResult] = await Promise.all([
    listAthletesForCoach(profileId),
    listTeams(),
  ]);

  const athletes = athletesResult.ok ? athletesResult.data : [];
  const teams = teamsResult.ok ? teamsResult.data : [];

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
        createTeamAction={wrappedCreate}
        loadAssignmentsAction={listAssignmentsForPlayerAction}
        revokeAssignmentAction={revokeAssignmentAction}
      />
    </div>
  );
}
