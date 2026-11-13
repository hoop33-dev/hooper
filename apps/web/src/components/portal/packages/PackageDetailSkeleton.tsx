import { BUYER_COLUMNS } from "@/src/lib/packages";
import { ArrowLeftIcon } from "../ui/icons";
import { TableSkeleton } from "../ui/TableSkeleton";

/* Placeholders mirroring the package detail layout and its tabs, so the
   swap to real content doesn't shift layout. */

function CardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="border-portal-border bg-portal-card rounded-xl border">
      <div className="border-portal-border border-b px-5 py-4">
        <div className="bg-portal-border/60 h-4 w-28 animate-pulse rounded" />
      </div>
      <div className="flex flex-col gap-3 px-5 py-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bg-portal-border/40 h-3 w-40 animate-pulse rounded"
          />
        ))}
      </div>
    </div>
  );
}

/** Mirrors `PackageDetailShell`'s header: rail, title band and tabs. */
export function PackageHeaderSkeleton() {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b">
      <div className="border-portal-border flex min-h-[38px] items-center justify-between gap-4 border-b px-7 py-2.5">
        <span className="text-portal-text3 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <ArrowLeftIcon size={13} />
          Back
        </span>
        <div className="bg-portal-border/50 h-3 w-28 animate-pulse rounded" />
      </div>
      <div className="border-portal-border flex items-center justify-between border-b px-7 py-4">
        <div className="flex flex-col gap-2">
          <div className="bg-portal-border/60 h-5 w-44 animate-pulse rounded" />
          <div className="bg-portal-border/40 h-3 w-72 animate-pulse rounded" />
        </div>
        <div className="bg-portal-border/40 h-9 w-28 animate-pulse rounded-lg" />
      </div>
      <div className="flex h-[60px] items-center gap-7 px-7">
        {[16, 16, 20].map((w, i) => (
          <div
            key={i}
            style={{ width: w * 4 }}
            className="bg-portal-border/50 h-3 animate-pulse rounded"
          />
        ))}
      </div>
    </div>
  );
}

export function PackageOverviewSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <CardSkeleton rows={1} />
        <CardSkeleton rows={1} />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={3} />
      </div>
    </div>
  );
}

export function PackageContentsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={3} />
        <CardSkeleton rows={2} />
      </div>
    </div>
  );
}

export function PackageBuyersSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden px-7 py-2">
        <TableSkeleton columns={BUYER_COLUMNS.slice(0, -1)} actionColumn />
      </div>
    </div>
  );
}
