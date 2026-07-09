import { QuickLinkCard } from "@/src/components/portal/dashboard/QuickLinkCard";
import { RecentPrograms } from "@/src/components/portal/dashboard/RecentPrograms";
import { StatCard } from "@/src/components/portal/dashboard/StatCard";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  DumbbellIcon,
  LayersIcon,
  StackIcon,
  UsersIcon,
} from "@/src/components/portal/ui/icons";
import { getCoachProfile } from "@/src/services/auth.service";
import { listPrograms } from "@/src/services/program.service";
import Link from "next/link";

const RECENT_PROGRAMS_LIMIT = 5;

export default async function DashboardPage() {
  const [programsResult, profileResult] = await Promise.all([
    listPrograms(),
    getCoachProfile(),
  ]);

  const programs = programsResult.ok ? programsResult.data : [];
  const profile = profileResult.ok ? profileResult.data : null;
  const recentPrograms = programs.slice(0, RECENT_PROGRAMS_LIMIT);
  const greeting = profile?.first_name
    ? `Welcome back, ${profile.first_name}`
    : "Welcome back";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting} — here's what's happening with your programs`}
      />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Programs"
            value={programs.length}
            icon={<LayersIcon size={18} />}
            href="/programs"
          />
          <StatCard
            label="Athletes"
            value="—"
            icon={<UsersIcon size={18} />}
            comingSoon
          />
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

        <div className="border-portal-border bg-portal-card mt-8 overflow-hidden rounded-xl border">
          <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-portal-text1 text-sm font-bold">
              Recently Edited Programs
            </h2>
            <Link
              href="/programs"
              className="text-portal-orange text-xs font-semibold hover:underline">
              View all programs
            </Link>
          </div>
          <RecentPrograms programs={recentPrograms} />
        </div>
      </div>
    </div>
  );
}
