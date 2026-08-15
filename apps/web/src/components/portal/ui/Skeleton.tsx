import { cn } from "@/src/lib/cn";

/** Base pulsing placeholder block. Compose the primitives below from this. */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-portal-border/60 animate-pulse rounded-md", className)}
    />
  );
}

/** Mirrors a table/list of rows. */
export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden px-7 py-5">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBlock
          key={i}
          className="h-14 w-full flex-shrink-0 rounded-lg"
        />
      ))}
    </div>
  );
}

/** Mirrors a grid of cards, e.g. dashboard stat/quick-link cards. */
export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Mirrors the large block/session canvas editors (programs, block templates, sessions). */
export function SkeletonCanvas() {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden px-7 py-5">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex w-64 flex-shrink-0 flex-col gap-2.5">
          <SkeletonBlock className="h-5 w-24" />
          {Array.from({ length: 4 }, (_, j) => (
            <SkeletonBlock key={j} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mirrors a single-record detail page: a header block plus a couple of content sections. */
export function SkeletonDetail() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-6">
        <SkeletonBlock className="h-12 w-12 flex-shrink-0 rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="mt-2 h-3.5 w-32" />
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-7 py-6">
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonBlock className="h-14 w-full rounded-xl" />
        <SkeletonBlock className="h-14 w-full rounded-xl" />
        <SkeletonBlock className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
