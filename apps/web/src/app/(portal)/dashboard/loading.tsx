import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";

export default function DashboardLoading() {
  return (
    <PageSkeleton title="Dashboard" subtitle="Welcome back">
      <div className="grid grid-cols-2 gap-4 pt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border-portal-border bg-portal-card h-24 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border-portal-border bg-portal-card h-20 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="border-portal-border bg-portal-card mt-8 h-64 animate-pulse rounded-xl border" />
    </PageSkeleton>
  );
}
