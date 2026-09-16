import { AthleteDashboardRow } from "@/src/components/portal/dashboard/AthleteDashboardRow";
import { DashboardListCard } from "@/src/components/portal/dashboard/DashboardListCard";
import { DashboardListCardSkeleton } from "@/src/components/portal/dashboard/DashboardListCardSkeleton";
import { FormDashboardRow } from "@/src/components/portal/dashboard/FormDashboardRow";
import { ProgramDashboardRow } from "@/src/components/portal/dashboard/ProgramDashboardRow";
import { QuickLinkCard } from "@/src/components/portal/dashboard/QuickLinkCard";
import { TeamDashboardRow } from "@/src/components/portal/dashboard/TeamDashboardRow";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  ClipboardIcon,
  DumbbellIcon,
  LayersIcon,
  StackIcon,
  UserIcon,
  UsersIcon,
} from "@/src/components/portal/ui/icons";
import { listRecentAthletesByLogin } from "@/src/services/athlete.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { listRecentFormsByCompletion } from "@/src/services/form.service";
import { listRecentProgramsByCompletion } from "@/src/services/program.service";
import { listRecentTeams } from "@/src/services/team.service";
import { Suspense } from "react";

const DASHBOARD_LIST_LIMIT = 6;

export default async function DashboardPage() {
  const profileResult = await getCoachProfile();
  const profile = profileResult.ok ? profileResult.data : null;
  const greeting = profile?.first_name
    ? `Welcome back, ${profile.first_name}`
    : "Welcome back";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting} - here's what's happening with your programs`}
      />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="grid grid-cols-2 gap-4">
          <Suspense fallback={<DashboardListCardSkeleton />}>
            <ProgramsDashboardCard />
          </Suspense>
          <Suspense fallback={<DashboardListCardSkeleton />}>
            <AthletesDashboardCard />
          </Suspense>
          <Suspense fallback={<DashboardListCardSkeleton />}>
            <TeamsDashboardCard />
          </Suspense>
          <Suspense fallback={<DashboardListCardSkeleton />}>
            <FormsDashboardCard />
          </Suspense>
        </div>

        <div className="mt-8">
          <h2 className="text-portal-text3 mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Quick links
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickLinkCard
              label="Exercise Library"
              description="Browse and manage your exercises"
              icon={<DumbbellIcon size={18} />}
              href="/exercises"
            />
            <QuickLinkCard
              label="Block Library"
              description="Reusable blocks and sessions"
              icon={<StackIcon size={18} />}
              href="/blocks"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Streams independently of the other 3 cards — a slow query here (the
 * program_recency join) shouldn't hold up Athletes/Teams/Forms. */
async function ProgramsDashboardCard() {
  const result = await listRecentProgramsByCompletion(DASHBOARD_LIST_LIMIT);
  const programs = result.ok ? result.data : [];

  return (
    <DashboardListCard
      title="Programs"
      href="/programs"
      viewAllLabel="View all programs"
      createHref="/programs?create=1"
      createLabel="Create program"
      icon={<LayersIcon size={18} />}
      isEmpty={programs.length === 0}
      emptyTitle="No programs yet"
      emptyHint="Create your first training program to see it here">
      {programs.map((program) => (
        <ProgramDashboardRow key={program.id} program={program} />
      ))}
    </DashboardListCard>
  );
}

async function AthletesDashboardCard() {
  const result = await listRecentAthletesByLogin(DASHBOARD_LIST_LIMIT);
  const athletes = result.ok ? result.data : [];

  return (
    <DashboardListCard
      title="Athletes"
      href="/athletes"
      viewAllLabel="View all athletes"
      icon={<UserIcon size={18} />}
      isEmpty={athletes.length === 0}
      emptyTitle="No athletes yet"
      emptyHint="Athletes you invite will show up here">
      {athletes.map((athlete) => (
        <AthleteDashboardRow key={athlete.id} athlete={athlete} />
      ))}
    </DashboardListCard>
  );
}

async function TeamsDashboardCard() {
  const result = await listRecentTeams(DASHBOARD_LIST_LIMIT);
  const teams = result.ok ? result.data : [];

  return (
    <DashboardListCard
      title="Teams"
      href="/teams"
      viewAllLabel="View all teams"
      icon={<UsersIcon size={18} />}
      isEmpty={teams.length === 0}
      emptyTitle="No teams yet"
      emptyHint="Create a team to start grouping athletes">
      {teams.map((team) => (
        <TeamDashboardRow key={team.id} team={team} />
      ))}
    </DashboardListCard>
  );
}

async function FormsDashboardCard() {
  const result = await listRecentFormsByCompletion(DASHBOARD_LIST_LIMIT);
  const forms = result.ok ? result.data : [];

  return (
    <DashboardListCard
      title="Forms"
      href="/forms"
      viewAllLabel="View all forms"
      createHref="/forms?create=1"
      createLabel="Create form"
      icon={<ClipboardIcon size={18} />}
      isEmpty={forms.length === 0}
      emptyTitle="No forms yet"
      emptyHint="Create a form to start collecting athlete feedback">
      {forms.map((form) => (
        <FormDashboardRow key={form.id} form={form} />
      ))}
    </DashboardListCard>
  );
}
