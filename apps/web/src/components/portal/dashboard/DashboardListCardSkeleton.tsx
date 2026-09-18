/**
 * Shared skeleton for each of the dashboard's 4 list cards — used both as
 * each card's `<Suspense>` fallback and 4x in the route's `loading.tsx`, so
 * the shape stays identical however the dashboard is entered.
 */
export function DashboardListCardSkeleton({
  rowCount = 6,
}: {
  rowCount?: number;
}) {
  return (
    <div className="border-portal-border bg-portal-card overflow-hidden rounded-xl border">
      <div className="border-portal-border flex h-14 items-center justify-between border-b px-5">
        <div className="bg-portal-border/60 h-4 w-28 animate-pulse rounded" />
        <div className="bg-portal-border/40 h-3 w-20 animate-pulse rounded" />
      </div>
      <div className="divide-portal-border flex flex-col divide-y">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className="bg-portal-border/50 h-9 w-9 flex-shrink-0 animate-pulse rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="bg-portal-border/60 h-3.5 w-40 animate-pulse rounded" />
              <div className="bg-portal-border/40 h-3 w-20 animate-pulse rounded" />
            </div>
            <div className="bg-portal-border/40 h-5 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
