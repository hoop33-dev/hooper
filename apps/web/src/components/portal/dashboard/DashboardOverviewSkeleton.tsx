const RECENT_PROGRAMS_LIMIT = 5;

/**
 * Placeholder for `DashboardOverview` — the stat cards + recent-programs list.
 * Shared by the page's `<Suspense>` fallback and the route `loading.tsx` so the
 * shape stays identical however the dashboard is entered.
 */
export function DashboardOverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border-portal-border bg-portal-card flex items-center gap-3.5 rounded-xl border p-4">
            <div className="bg-portal-border/50 h-10 w-10 flex-shrink-0 animate-pulse rounded-lg" />
            <div className="flex flex-col gap-2">
              <div className="bg-portal-border/60 h-6 w-10 animate-pulse rounded" />
              <div className="bg-portal-border/40 h-3 w-16 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-portal-border bg-portal-card mt-8 overflow-hidden rounded-xl border">
        <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
          <div className="bg-portal-border/60 h-4 w-44 animate-pulse rounded" />
          <div className="bg-portal-border/40 h-3 w-28 animate-pulse rounded" />
        </div>
        <div className="divide-portal-border flex flex-col divide-y">
          {Array.from({ length: RECENT_PROGRAMS_LIMIT }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="bg-portal-border/50 h-9 w-9 flex-shrink-0 animate-pulse rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="bg-portal-border/60 h-3.5 w-40 animate-pulse rounded" />
                <div className="bg-portal-border/40 h-3 w-20 animate-pulse rounded" />
              </div>
              <div className="bg-portal-border/40 h-5 w-16 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
