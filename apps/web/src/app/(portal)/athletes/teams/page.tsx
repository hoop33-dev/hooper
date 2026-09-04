import { AthletesTabs } from "@/src/components/portal/athletes/AthletesTabs";
import type { TeamCreateFormData } from "@/src/components/portal/athletes/teams/TeamCreateModal";
import { TeamsListShell } from "@/src/components/portal/athletes/teams/TeamsListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listTeams } from "@/src/services/team.service";
import { createTeamAction, updateTeamAction } from "./actions";

export default async function TeamsPage() {
  const [teamsResult, profileResult] = await Promise.all([
    listTeams(),
    getCoachProfileId(),
  ]);

  const teams = teamsResult.ok ? teamsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  async function wrappedCreate(data: TeamCreateFormData) {
    "use server";
    return createTeamAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Teams"
        subtitle="Group athletes into teams and assign programs together"
        action={<AthletesTabs />}
      />
      {!teamsResult.ok && (
        <div className="border-b border-red-200 bg-red-50 px-7 py-2 text-xs text-red-600">
          Couldn&apos;t load teams: {teamsResult.error}
        </div>
      )}
      <TeamsListShell
        teams={teams}
        createAction={wrappedCreate}
        updateAvatarAction={updateTeamAction}
      />
    </div>
  );
}
