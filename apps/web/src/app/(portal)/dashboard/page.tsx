import { QuickLinkCard } from "@/src/components/portal/dashboard/QuickLinkCard";
import { RecentPrograms } from "@/src/components/portal/dashboard/RecentPrograms";
import { StatCard } from "@/src/components/portal/dashboard/StatCard";
import { AppLink } from "@/src/components/portal/ui/AppLink";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  DumbbellIcon,
  LayersIcon,
  StackIcon,
  UsersIcon,
} from "@/src/components/portal/ui/icons";
import { countAthletes } from "@/src/services/athlete.service";
import { getCoachProfile } from "@/src/services/auth.service";
import {
  countPrograms,
  listRecentPrograms,
} from "@/src/services/program.service";
import { Suspense } from "react";

const RECENT_PROGRAMS_LIMIT = 5;

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
        <Suspense fallback={<DashboardOverviewSkeleton />}>
          <DashboardOverview />
        </Suspense>

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

/** Counts + recent list — the only data-dependent part of the dashboard, so it
 * streams in behind the header rather than blocking first paint. Uses cheap
 * count reads instead of the full `listPrograms` / `listAthletes` queries. */
async function DashboardOverview() {
  const [programCountResult, athleteCountResult, recentResult] =
    await Promise.all([
      countPrograms(),
      countAthletes(),
      listRecentPrograms(RECENT_PROGRAMS_LIMIT),
    ]);

  const programCount = programCountResult.ok ? programCountResult.data : 0;
  const athleteCount = athleteCountResult.ok ? athleteCountResult.data : 0;
  const recentPrograms = recentResult.ok ? recentResult.data : [];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Programs"
          value={programCount}
          icon={<LayersIcon size={18} />}
          href="/programs"
        />
        <StatCard
          label="Athletes"
          value={athleteCount}
          icon={<UsersIcon size={18} />}
          href="/athletes"
        />
      </div>

      <div className="border-portal-border bg-portal-card mt-8 overflow-hidden rounded-xl border">
        <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-portal-text1 text-sm font-bold">
            Recently Edited Programs
          </h2>
          <AppLink
            href="/programs"
            className="text-portal-orange text-xs font-semibold hover:underline">
            View all programs
          </AppLink>
        </div>
        <RecentPrograms programs={recentPrograms} />
      </div>
    </>
  );
}

function DashboardOverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border-portal-border bg-portal-card h-[74px] animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="border-portal-border bg-portal-card mt-8 h-64 animate-pulse rounded-xl border" />
    </>
  );
}
