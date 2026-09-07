import { DashboardOverviewSkeleton } from "@/src/components/portal/dashboard/DashboardOverviewSkeleton";
import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";

export default function DashboardLoading() {
  return (
    <PageSkeleton
      title="Dashboard"
      subtitle="Welcome back - here's what's happening with your programs">
      <div className="pt-4">
        <DashboardOverviewSkeleton />

        <div className="mt-8">
          <h2 className="text-portal-text3 mb-3 text-[11px] font-semibold tracking-widest uppercase">
            Quick links
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="border-portal-border bg-portal-card flex items-center gap-3.5 rounded-xl border p-4">
                <div className="bg-portal-border/50 h-10 w-10 flex-shrink-0 animate-pulse rounded-lg" />
                <div className="flex flex-col gap-2">
                  <div className="bg-portal-border/60 h-3.5 w-28 animate-pulse rounded" />
                  <div className="bg-portal-border/40 h-3 w-40 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
