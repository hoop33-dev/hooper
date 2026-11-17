import { AthleteDetailShell } from "@/src/components/portal/athletes/AthleteDetailShell";
import { AthleteDetailFallback } from "@/src/components/portal/athletes/AthleteDetailSkeleton";
import {
  getAthleteAccount,
  getAthleteById,
  listAthletePackages,
  listPackageProgramsForAthlete,
} from "@/src/services/athlete.service";
import { listPrograms } from "@/src/services/program.service";
import { listTeams, listTeamsForAthlete } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  addAthleteToTeamAction,
  assignProgramToAthleteAction,
  removeAthleteFromTeamAction,
  sendAthletePasswordResetAction,
  unassignProgramFromAthleteAction,
  updateAthleteProfileAction,
} from "../actions";

type Props = { params: Promise<{ id: string }>; children: ReactNode };

/** The header and tabs every athlete tab shares. Each tab is its own route
 * (`page.tsx`, `details/`, `billing/`) rendered as `children`. */
export default function AthleteDetailLayout(props: Props) {
  // Streams behind its own boundary so opening an athlete shows the detail
  // skeleton rather than the athletes list's loading.tsx.
  return (
    <Suspense fallback={<AthleteDetailFallback />}>
      <AthleteDetailContent {...props} />
    </Suspense>
  );
}

async function AthleteDetailContent({ params, children }: Props) {
  const { id } = await params;
  const [
    athleteResult,
    accountResult,
    teamsResult,
    packageProgramsResult,
    packagesResult,
    allTeamsResult,
    programsResult,
  ] = await Promise.all([
    getAthleteById(id),
    getAthleteAccount(id),
    listTeamsForAthlete(id),
    listPackageProgramsForAthlete(id),
    listAthletePackages(id),
    listTeams(),
    listPrograms(),
  ]);

  if (!athleteResult.ok) notFound();

  return (
    <AthleteDetailShell
      athlete={athleteResult.data}
      account={accountResult.ok ? accountResult.data : null}
      teams={teamsResult.ok ? teamsResult.data : []}
      packagePrograms={
        packageProgramsResult.ok ? packageProgramsResult.data : []
      }
      packages={packagesResult.ok ? packagesResult.data : []}
      allTeams={allTeamsResult.ok ? allTeamsResult.data : []}
      allPrograms={programsResult.ok ? programsResult.data : []}
      assignProgramAction={assignProgramToAthleteAction}
      unassignProgramAction={unassignProgramFromAthleteAction}
      addToTeamAction={addAthleteToTeamAction}
      removeFromTeamAction={removeAthleteFromTeamAction}
      sendPasswordResetAction={sendAthletePasswordResetAction}
      updateProfileAction={updateAthleteProfileAction}>
      {children}
    </AthleteDetailShell>
  );
}
