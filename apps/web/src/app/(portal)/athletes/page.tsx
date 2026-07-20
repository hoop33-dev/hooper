import { TeamsListShell } from "@/src/components/portal/athletes/TeamsListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listTeams } from "@/src/services/team.service";
import { createTeamAction } from "./actions";

export default async function AthletesPage() {
  const [teamsResult, profileResult] = await Promise.all([
    listTeams(),
    getCoachProfile(),
  ]);

  const teams = teamsResult.ok ? teamsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

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
      <TeamsListShell teams={teams} createAction={wrappedCreate} />
    </div>
  );
}
